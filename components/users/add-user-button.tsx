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
        className='bg-tawakal-green hover:bg-tawakal-green/90 text-white w-full sm:w-auto h-9 sm:h-10 text-sm sm:text-base'
        onClick={() => setIsAddAccountDialogOpen(true)}>
        <UserPlus size={14} className='mr-1 sm:mr-2 sm:w-4 sm:h-4' />
        <span className='hidden sm:inline'>Add User</span>
        <span className='sm:hidden'>Add</span>
      </Button>
      <AddAccountDialog
        open={isAddAccountDialogOpen}
        onOpenChange={setIsAddAccountDialogOpen}
      />
    </>
  );
}
