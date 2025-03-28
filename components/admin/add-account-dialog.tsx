"use client";

import { useState } from "react";
import { createUser } from "@/app/actions/admin/create-user";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAccountDialog({
  open,
  onOpenChange,
}: AddAccountDialogProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "user",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      role: "user",
    });
    setSuccess(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Small delay to allow animation to complete before resetting
      setTimeout(resetForm, 300);
    }
    onOpenChange(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create a FormData object to pass to the server action
      const formDataObject = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataObject.append(key, value);
      });

      // Call the server action
      const result = await createUser(formDataObject);

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Account created successfully");
      setSuccess(true);
    } catch (error: any) {
      console.error("Error creating account:", error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[400px]'>
        <DialogHeader>
          <DialogTitle className='text-tawakal-blue'>
            Add New Account
          </DialogTitle>
          <DialogDescription>
            Create a new user account for the voting system.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className='py-6 space-y-4'>
            <Alert className='bg-tawakal-green/10 border-tawakal-green/20'>
              <CheckCircle2 className='h-4 w-4 text-tawakal-green' />
              <AlertDescription className='text-tawakal-green'>
                Account created successfully. The user can now login with the
                provided credentials.
              </AlertDescription>
            </Alert>
            <div className='flex justify-between pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => handleOpenChange(false)}>
                Close
              </Button>
              <Button
                className='bg-tawakal-green hover:bg-tawakal-green/90'
                onClick={() => {
                  resetForm();
                  setSuccess(false);
                }}>
                Add Another Account
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className='grid gap-4 py-4'>
              <div className='grid grid-cols-2 gap-3'>
                <div className='grid gap-2'>
                  <Label htmlFor='first_name' className='text-tawakal-blue'>
                    First Name
                  </Label>
                  <Input
                    id='first_name'
                    name='first_name'
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder='Enter first name'
                    required
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='last_name' className='text-tawakal-blue'>
                    Last Name
                  </Label>
                  <Input
                    id='last_name'
                    name='last_name'
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder='Enter last name'
                    required
                  />
                </div>
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='email' className='text-tawakal-blue'>
                  Email
                </Label>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  value={formData.email}
                  onChange={handleChange}
                  placeholder='Enter email address'
                  required
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='password' className='text-tawakal-blue'>
                  Password
                </Label>
                <Input
                  id='password'
                  name='password'
                  type='password'
                  value={formData.password}
                  onChange={handleChange}
                  placeholder='Create a password'
                  required
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='role' className='text-tawakal-blue'>
                  Role
                </Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger className='border-tawakal-blue/20 focus:ring-tawakal-blue/30'>
                    <SelectValue placeholder='Select a role' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='user'>Voter</SelectItem>
                    <SelectItem value='admin'>Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={loading}
                className='bg-tawakal-green hover:bg-tawakal-green/90'>
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Creating...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
