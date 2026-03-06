"use client";
import Tesseract from "tesseract.js";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ParticipantSelector } from "./participant-selector";
import { GroupSelector } from "./group-selector";
import { CategorySelector } from "./category-selector";
import { SplitSelector } from "./split-selector";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { getAllCategories } from "@/lib/expense-categories";



/* ---------- schema ---------- */
const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
  category: z.string().optional(),
  date: z.date(),
  paidByUserId: z.string().min(1, "Payer is required"),
  splitType: z.enum(["equal", "percentage", "exact"]),
  groupId: z.string().optional(),
});

export function ExpenseForm({ type = "individual", onSuccess }) {
  const [participants, setParticipants] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [splits, setSplits] = useState([]);

  /* OCR state */
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef(null);

  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
  const createExpense = useConvexMutation(api.expenses.createExpense);
  const categories = getAllCategories();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      date: new Date(),
      paidByUserId: currentUser?._id || "",
      splitType: "equal",
      groupId: undefined,
    },
  });

  const amountValue = watch("amount");
  const paidByUserId = watch("paidByUserId");

  useEffect(() => {
    if (participants.length === 0 && currentUser) {
      setParticipants([
        {
          id: currentUser._id,
          name: currentUser.name,
          email: currentUser.email,
          imageUrl: currentUser.imageUrl,
        },
      ]);
    }
  }, [currentUser, participants]);

  /* ---------- OCR ---------- */
const handleBillScan = async (file) => {
  if (!file) return;

  try {
    setIsScanning(true);

    const {
      data: { text },
    } = await Tesseract.recognize(file, "eng");

    console.log("OCR TEXT:\n", text);

    const cleaned = text.replace(/\s+/g, " ");

    /* ---------- 1. STRONG KEYWORD MATCH ---------- */
    const keywordMatch = cleaned.match(
      /(grand total|total amount|net payable|amount payable|balance due|total)[^\d₹]{0,15}₹?\s*([\d,]+(?:\.\d{2})?)/i
    );

    if (keywordMatch) {
      const value = keywordMatch[2].replace(/,/g, "");
      setValue("amount", value, { shouldValidate: true, shouldDirty: true });
      toast.success("Amount detected");
      return;
    }

    /* ---------- 2. LINE-AWARE FALLBACK ---------- */
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    let candidates = [];

    lines.forEach((line, index) => {
      const matches = line.match(/₹?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g);
      if (!matches) return;

      matches.forEach((raw) => {
        const value = parseFloat(raw.replace(/[₹,\s]/g, ""));
        if (isNaN(value)) return;

        candidates.push({
          value,
          raw,
          line,
          fromBottom: lines.length - index,
        });
      });
    });

    /* ---------- 3. FILTER OUT BAD NUMBERS ---------- */
    candidates = candidates.filter((c) => {
      if (/%/.test(c.line)) return false;     // GST / tax %
      if (c.value < 10) return false;         // quantities
      if (c.value > 100000) return false;     // phone/order IDs
      return true;
    });

    if (!candidates.length) {
      toast.error("Could not detect amount");
      return;
    }

    /* ---------- 4. SCORE & PICK ---------- */
    candidates = candidates.map((c) => {
      let score = 0;
      if (/\.\d{2}$/.test(c.raw)) score += 3;
      if (c.fromBottom <= 3) score += 3;
      if (/total|payable|balance/i.test(c.line)) score += 5;
      score += Math.min(c.value / 50, 4);
      return { ...c, score };
    });

    candidates.sort((a, b) => b.score - a.score);

    setValue("amount", candidates[0].value.toFixed(2), {
      shouldValidate: true,
      shouldDirty: true,
    });

    toast.success("Amount detected");
  } catch (err) {
    console.error("OCR error:", err);
    toast.error("Bill scan failed");
  } finally {
    setIsScanning(false);
  }
};



  /* ---------- submit ---------- */
  const onSubmit = async (data) => {
    try {
      const amount = parseFloat(data.amount);

      const formattedSplits = splits.map((split) => ({
        userId: split.userId,
        amount: split.amount,
        paid: split.userId === data.paidByUserId,
      }));

      const total = formattedSplits.reduce((s, x) => s + x.amount, 0);
      if (Math.abs(total - amount) > 0.01) {
        toast.error("Split amounts don't add up");
        return;
      }

      const groupId = type === "individual" ? undefined : data.groupId;

      await createExpense.mutate({
        description: data.description,
        amount,
        category: data.category || "Other",
        date: data.date.getTime(),
        paidByUserId: data.paidByUserId,
        splitType: data.splitType,
        splits: formattedSplits,
        groupId,
      });

      toast.success("Expense created");
      reset();

      const other = participants.find((p) => p.id !== currentUser._id);
      onSuccess?.(type === "individual" ? other?.id : groupId);
    } catch (e) {
      toast.error("Failed to create expense");
    }
  };

  if (!currentUser) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Description + Amount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Description</Label>
            <Input {...register("description")} />
          </div>

          <div className="space-y-2">
            <Label>Amount</Label>

            <div className="flex gap-2">
              <Input type="number" step="0.01" {...register("amount")} />

              {/* ✅ FIXED SCAN BUTTON */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleBillScan(e.target.files?.[0])
                }
              />

              <Button
                type="button"
                variant="outline"
                disabled={isScanning}
                onClick={() => fileInputRef.current?.click()}
              >
                {isScanning ? "Scanning…" : "Scan bill"}
              </Button>
            </div>
          </div>
        </div>

        {/* Category and date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>

            <CategorySelector
              categories={categories || []}
              onChange={(categoryId) => {
                if (categoryId) {
                  setValue("category", categoryId);
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setValue("date", date);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Group selector (for group expenses) */}
        {type === "group" && (
          <div className="space-y-2">
            <Label>Group</Label>
            <GroupSelector
              onChange={(group) => {
                // Only update if the group has changed to prevent loops
                if (!selectedGroup || selectedGroup.id !== group.id) {
                  setSelectedGroup(group);
                  setValue("groupId", group.id);

                  // Update participants with the group members
                  if (group.members && Array.isArray(group.members)) {
                    // Set the participants once, don't re-set if they're the same
                    setParticipants(group.members);
                  }
                }
              }}
            />
            {!selectedGroup && (
              <p className="text-xs text-amber-600">
                Please select a group to continue
              </p>
            )}
          </div>
        )}

        {/* Participants (for individual expenses) */}
        {type === "individual" && (
          <div className="space-y-2">
            <Label>Participants</Label>
            <ParticipantSelector
              participants={participants}
              onParticipantsChange={setParticipants}
            />
            {participants.length <= 1 && (
              <p className="text-xs text-amber-600">
                Please add at least one other participant
              </p>
            )}
          </div>
        )}

        {/* Paid by selector */}
        <div className="space-y-2">
          <Label>Paid by</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register("paidByUserId")}
          >
            <option value="">Select who paid</option>
            {participants.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {participant.id === currentUser._id ? "You" : participant.name}
              </option>
            ))}
          </select>
          {errors.paidByUserId && (
            <p className="text-sm text-red-500">
              {errors.paidByUserId.message}
            </p>
          )}
        </div>

        {/* Split type */}
        <div className="space-y-2">
          <Label>Split type</Label>
          <Tabs
            defaultValue="equal"
            onValueChange={(value) => setValue("splitType", value)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="equal">Equal</TabsTrigger>
              <TabsTrigger value="percentage">Percentage</TabsTrigger>
              <TabsTrigger value="exact">Exact Amounts</TabsTrigger>
            </TabsList>
            <TabsContent value="equal" className="pt-4">
              <p className="text-sm text-muted-foreground">
                Split equally among all participants
              </p>
              <SplitSelector
                type="equal"
                amount={parseFloat(amountValue) || 0}
                participants={participants}
                paidByUserId={paidByUserId}
                onSplitsChange={setSplits} // Use setSplits directly
              />
            </TabsContent>
            <TabsContent value="percentage" className="pt-4">
              <p className="text-sm text-muted-foreground">
                Split by percentage
              </p>
              <SplitSelector
                type="percentage"
                amount={parseFloat(amountValue) || 0}
                participants={participants}
                paidByUserId={paidByUserId}
                onSplitsChange={setSplits} // Use setSplits directly
              />
            </TabsContent>
            <TabsContent value="exact" className="pt-4">
              <p className="text-sm text-muted-foreground">
                Enter exact amounts
              </p>
              <SplitSelector
                type="exact"
                amount={parseFloat(amountValue) || 0}
                participants={participants}
                paidByUserId={paidByUserId}
                onSplitsChange={setSplits} // Use setSplits directly
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || participants.length <= 1}
        >
          {isSubmitting ? "Creating..." : "Create Expense"}
        </Button>
      </div>
    </form>
  );
}