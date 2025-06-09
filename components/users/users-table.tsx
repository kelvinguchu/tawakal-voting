"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { User } from "@/lib/types/database";

interface UsersTableProps {
  users: User[];
  currentUserId: string;
}

export function UsersTable({
  users,
  currentUserId,
}: Readonly<UsersTableProps>) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "",
  });
  const supabase = createClient();

  // Update form data when selected user changes
  useEffect(() => {
    if (selectedUser) {
      setEditForm({
        first_name: selectedUser.first_name || "",
        last_name: selectedUser.last_name || "",
        email: selectedUser.email,
        role: selectedUser.role,
      });
    }
  }, [selectedUser]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (value: string) => {
    setEditForm((prev) => ({
      ...prev,
      role: value,
    }));
  };

  const handleEditSubmit = async () => {
    if (!selectedUser) return;

    setIsLoading(true);
    try {
      // Validate form
      if (!editForm.first_name || !editForm.last_name || !editForm.email) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Update in database
      const { error } = await supabase
        .from("users")
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          email: editForm.email,
          role: editForm.role,
        })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast.success("User updated successfully");
      setIsEditOpen(false);

      // Force a page refresh to show updated data
      window.location.reload();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.message ?? "Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_active: !selectedUser.is_active })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast.success(
        `User ${
          selectedUser.is_active ? "deactivated" : "activated"
        } successfully`
      );
      // Force a page refresh to show updated data
      window.location.reload();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.message ?? "Failed to update user status");
    } finally {
      setIsLoading(false);
      setIsConfirmOpen(false);
    }
  };

  const openConfirmDialog = (user: User) => {
    setSelectedUser(user);
    setIsConfirmOpen(true);
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setIsEditOpen(true);
  };

  // Sort users to put current user at the top
  const sortedUsers = [...users].sort((a, b) => {
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    return 0;
  });

  return (
    <>
      {/* Mobile Card View - Hidden on desktop */}
      <div className='md:hidden space-y-4'>
        {sortedUsers && sortedUsers.length > 0 ? (
          sortedUsers.map((user) => {
            const isCurrentUser = user.id === currentUserId;
            return (
              <div
                key={user.id}
                className={`p-4 rounded-lg border ${
                  isCurrentUser
                    ? "bg-tawakal-blue/5 border-tawakal-blue/20"
                    : ""
                }`}>
                <div className='flex justify-between items-start mb-3'>
                  <div>
                    <h3 className='font-medium text-sm'>
                      {user.first_name} {user.last_name}
                      {isCurrentUser && (
                        <Badge
                          variant='outline'
                          className='ml-2 border-tawakal-blue text-tawakal-blue bg-tawakal-blue/10 text-xs'>
                          you
                        </Badge>
                      )}
                    </h3>
                    <p className='text-xs text-muted-foreground break-all'>
                      {user.email}
                    </p>
                  </div>
                  <div className='flex gap-1'>
                    <Badge
                      className={`text-xs ${
                        user.role === "admin"
                          ? "bg-tawakal-blue hover:bg-tawakal-blue/80"
                          : "bg-tawakal-green hover:bg-tawakal-green/80"
                      }`}>
                      {user.role === "admin" ? "Admin" : "Voter"}
                    </Badge>
                  </div>
                </div>
                <div className='flex justify-between items-center mb-3'>
                  <Badge
                    variant={user.is_active ? "outline" : "secondary"}
                    className={`text-xs ${
                      user.is_active
                        ? "border-tawakal-green text-tawakal-green"
                        : ""
                    }`}>
                    {user.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <span className='text-xs text-muted-foreground'>
                    {new Date(user.created_at).toISOString().split("T")[0]}
                  </span>
                </div>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex-1 border-tawakal-blue text-tawakal-blue hover:bg-tawakal-blue/10 text-xs h-8'
                    onClick={() => openEditDialog(user)}>
                    Edit
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => openConfirmDialog(user)}
                    disabled={isCurrentUser}
                    className={`flex-1 text-xs h-8 ${
                      user.is_active
                        ? "border-tawakal-gold text-tawakal-gold hover:bg-tawakal-gold/10"
                        : "border-tawakal-green text-tawakal-green hover:bg-tawakal-green/10"
                    }`}>
                    {isCurrentUser
                      ? "Can't deactivate"
                      : user.is_active
                      ? "Deactivate"
                      : "Activate"}
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className='text-center py-8 text-muted-foreground'>
            No users found.
          </div>
        )}
      </div>

      {/* Desktop Table View - Hidden on mobile */}
      <div className='hidden md:block'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers && sortedUsers.length > 0 ? (
              sortedUsers.map((user) => {
                const isCurrentUser = user.id === currentUserId;
                return (
                  <TableRow
                    key={user.id}
                    className={isCurrentUser ? "bg-tawakal-blue/5" : ""}>
                    <TableCell className='font-medium'>
                      <div className='flex items-center gap-2'>
                        {user.first_name} {user.last_name}
                        {isCurrentUser && (
                          <Badge
                            variant='outline'
                            className='ml-2 border-tawakal-blue text-tawakal-blue bg-tawakal-blue/10'>
                            you
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          user.role === "admin"
                            ? "bg-tawakal-blue hover:bg-tawakal-blue/80"
                            : "bg-tawakal-green hover:bg-tawakal-green/80"
                        }>
                        {user.role === "admin" ? "Admin" : "Voter"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.is_active ? "outline" : "secondary"}
                        className={
                          user.is_active
                            ? "border-tawakal-green text-tawakal-green"
                            : ""
                        }>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toISOString().split("T")[0]}
                    </TableCell>
                    <TableCell>
                      <div className='flex space-x-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          className='border-tawakal-blue text-tawakal-blue hover:bg-tawakal-blue/10'
                          onClick={() => openEditDialog(user)}>
                          Edit
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => openConfirmDialog(user)}
                          disabled={isCurrentUser} // Disable self-deactivation
                          className={
                            user.is_active
                              ? "border-tawakal-gold text-tawakal-gold hover:bg-tawakal-gold/10"
                              : "border-tawakal-green text-tawakal-green hover:bg-tawakal-green/10"
                          }>
                          {isCurrentUser
                            ? "Cannot deactivate"
                            : user.is_active
                            ? "Deactivate"
                            : "Activate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className='text-center py-8 text-muted-foreground'>
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className='w-[95vw] max-w-[400px] mx-4'>
          <DialogHeader>
            <DialogTitle className='text-tawakal-blue text-lg sm:text-xl'>
              Confirm User Status Change
            </DialogTitle>
            <DialogDescription className='text-sm sm:text-base'>
              {selectedUser?.is_active
                ? "Are you sure you want to deactivate this user? They will no longer be able to log in."
                : "Are you sure you want to activate this user? They will be able to log in again."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='mt-4 flex-col sm:flex-row gap-2 sm:gap-0'>
            <Button
              variant='outline'
              onClick={() => setIsConfirmOpen(false)}
              className='w-full sm:w-auto order-2 sm:order-1'>
              Cancel
            </Button>
            <Button
              onClick={handleToggleStatus}
              disabled={isLoading}
              className={`w-full sm:w-auto order-1 sm:order-2 ${
                selectedUser?.is_active
                  ? "bg-tawakal-gold hover:bg-tawakal-gold/90"
                  : "bg-tawakal-green hover:bg-tawakal-green/90"
              }`}>
              {isLoading
                ? "Processing..."
                : selectedUser?.is_active
                ? "Deactivate"
                : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className='w-[95vw] max-w-[500px] mx-4 max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-tawakal-blue text-lg sm:text-xl'>
              Edit User
            </DialogTitle>
            <DialogDescription className='text-sm sm:text-base'>
              Update user information. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div className='grid gap-2'>
                <Label
                  htmlFor='first_name'
                  className='text-tawakal-blue text-sm'>
                  First Name
                </Label>
                <Input
                  id='first_name'
                  name='first_name'
                  value={editForm.first_name}
                  onChange={handleEditChange}
                  placeholder='Enter first name'
                  className='h-9 sm:h-10'
                />
              </div>
              <div className='grid gap-2'>
                <Label
                  htmlFor='last_name'
                  className='text-tawakal-blue text-sm'>
                  Last Name
                </Label>
                <Input
                  id='last_name'
                  name='last_name'
                  value={editForm.last_name}
                  onChange={handleEditChange}
                  placeholder='Enter last name'
                  className='h-9 sm:h-10'
                />
              </div>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='email' className='text-tawakal-blue text-sm'>
                Email
              </Label>
              <Input
                id='email'
                name='email'
                type='email'
                value={editForm.email}
                onChange={handleEditChange}
                placeholder='Enter email address'
                className='h-9 sm:h-10'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='role' className='text-tawakal-blue text-sm'>
                Role
              </Label>
              <Select value={editForm.role} onValueChange={handleRoleChange}>
                <SelectTrigger className='border-tawakal-blue/20 focus:ring-tawakal-blue/30 h-9 sm:h-10'>
                  <SelectValue placeholder='Select a role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='user'>Voter</SelectItem>
                  <SelectItem value='admin'>Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className='flex-col sm:flex-row gap-2 sm:gap-0'>
            <Button
              variant='outline'
              onClick={() => setIsEditOpen(false)}
              className='w-full sm:w-auto order-2 sm:order-1'>
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={isLoading}
              className='w-full sm:w-auto order-1 sm:order-2 bg-tawakal-blue hover:bg-tawakal-blue/90'>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
