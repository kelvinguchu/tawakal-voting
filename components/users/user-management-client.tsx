"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UsersTable } from "@/components/users/users-table";
import { UserSearch } from "@/components/users/user-search";
import { AddUserButton } from "@/components/users/add-user-button";
import { User } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";

interface UserManagementClientProps {
  initialUsers: User[];
  currentUserId: string;
}

export function UserManagementClient({
  initialUsers,
  currentUserId,
}: UserManagementClientProps) {
  const [filteredUsers, setFilteredUsers] = useState<User[]>(initialUsers);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredUsers(initialUsers);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = initialUsers.filter(
      (user) =>
        user.first_name?.toLowerCase().includes(lowercaseQuery) ||
        user.last_name?.toLowerCase().includes(lowercaseQuery) ||
        user.email.toLowerCase().includes(lowercaseQuery) ||
        user.role.toLowerCase().includes(lowercaseQuery)
    );
    setFilteredUsers(filtered);
  };

  return (
    <div className='w-full max-w-full'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold'>User Management</h1>
        <p className='text-muted-foreground mt-1'>
          View and manage user accounts in the system
        </p>
      </div>

      <div className='flex justify-between items-center mb-6'>
        <UserSearch onSearch={handleSearch} />
        <AddUserButton />
      </div>

      <Card>
        <CardHeader className='pb-4'>
          <CardTitle>System Users</CardTitle>
          <CardDescription>
            {filteredUsers.length === initialUsers.length
              ? `Total users: ${initialUsers.length}`
              : `Showing ${filteredUsers.length} of ${initialUsers.length} users`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable users={filteredUsers} currentUserId={currentUserId} />
        </CardContent>
      </Card>
    </div>
  );
}
