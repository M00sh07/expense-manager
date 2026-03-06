"use client";

import { useState, useEffect } from "react";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { BarLoader } from "react-spinners";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function GroupSelector({ onChange }) {
  const [selectedGroupId, setSelectedGroupId] = useState("");

  // Single query to get all data we need
  const { data, isLoading } = useConvexQuery(
    api.groups.getGroupOrMembers,
    selectedGroupId ? { groupId: selectedGroupId } : {}
  );

  // When group data changes, notify parent
  useEffect(() => {
    if (data?.selectedGroup && onChange) {
      onChange(data.selectedGroup);
    }
  }, [data, onChange]);

  const handleGroupChange = (groupId) => {
    setSelectedGroupId(groupId);
  };

  if (isLoading) {
    return <BarLoader width="100%" color="#36d7b7" />;
  }

  if (!Array.isArray(data?.groups) || data.groups.length === 0) {
    return (
      <div className="text-sm text-amber-600 p-2 bg-amber-50 rounded-md">
        You need to create a group first before adding a group expense.
      </div>
    );
  }

  // HARD FILTER to prevent key/value issues
  const groups = data.groups.filter(
    (group) => group && typeof group._id === "string" && group.name
  );

  return (
    <div>
      <Select value={selectedGroupId} onValueChange={handleGroupChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a group" />
        </SelectTrigger>

        <SelectContent>
          {groups.map((group) => (
            <SelectItem
              key={group._id}      // UNIQUE & STABLE
              value={group._id}    // STRING ONLY
              textValue={group.name}
            >
              {group.name}         {/* TEXT ONLY — Radix safe */}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading && selectedGroupId && (
        <div className="mt-2">
          <BarLoader width="100%" color="#36d7b7" />
        </div>
      )}
    </div>
  );
}
