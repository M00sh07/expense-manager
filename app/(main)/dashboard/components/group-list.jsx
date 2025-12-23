import Link from "next/link";
import { Users } from "lucide-react";
import React from "react";

export function GroupList({ groups }) {
  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No groups yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create a group to start tracking shared expenses
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        // ✅ Always use Convex _id (fallback to id just in case)
        const groupId = group._id ?? group.id;

        // Safety guard — prevents /groups/undefined
        if (!groupId) return null;

        const balance = group.balance ?? 0;

        return (
          <Link
            key={groupId}
            href={`/groups/${groupId}`}
            className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="font-medium">{group.name}</p>
                <p className="text-xs text-muted-foreground">
                  {group.members?.length ?? 0} members
                </p>
              </div>
            </div>

            {balance !== 0 && (
              <span
                className={`text-sm font-medium ${
                  balance > 0
                    ? "text-green-600"
                    : balance < 0
                    ? "text-red-600"
                    : "text-muted-foreground"
                }`}
              >
                {balance > 0 ? "+" : ""}₹{balance.toFixed(2)}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
