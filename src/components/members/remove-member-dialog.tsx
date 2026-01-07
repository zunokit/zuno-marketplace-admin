"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { removeMemberAction } from "@/app/actions/members/member-actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Member = {
  id: string;
  userName: string;
  userEmail: string;
  role: string;
};

type RemoveMemberDialogProps = {
  member: Member;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function RemoveMemberDialog({
  member,
  open,
  onOpenChange,
  onSuccess,
}: RemoveMemberDialogProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleRemove() {
    setIsRemoving(true);

    const result = await removeMemberAction(member.id);

    if (result.success) {
      toast.success(result.message || "Member removed successfully");
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error("error" in result ? result.error : "Failed to remove member");
    }

    setIsRemoving(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Member</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove{" "}
            <strong className="font-semibold text-foreground">
              {member.userName}
            </strong>{" "}
            ({member.userEmail}) from this project?
            <br />
            <br />
            They will immediately lose access to all project data and features.
            <br />
            <br />
            <span className="text-destructive font-medium">
              This action cannot be undone.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={isRemoving}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isRemoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isRemoving ? "Removing..." : "Remove Member"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
