"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { AddAccountDialog } from "@/components/admin/add-account-dialog";

export function AddUserButton() {
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);

  return (
    <>
      <Button
        className='bg-tawakal-green hover:bg-tawakal-green/90 text-white'
        onClick={() => setIsAddAccountDialogOpen(true)}>
        <UserPlus size={16} className='mr-2' />
        Add User
      </Button>
      <AddAccountDialog
        open={isAddAccountDialogOpen}
        onOpenChange={setIsAddAccountDialogOpen}
      />
    </>
  );
}
