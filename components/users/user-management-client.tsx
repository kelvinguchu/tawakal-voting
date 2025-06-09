"use client";

import { useState } from "react";
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

interface UserManagementClientProps {
  initialUsers: User[];
  currentUserId: string;
}

export function UserManagementClient({
  initialUsers,
  currentUserId,
}: Readonly<UserManagementClientProps>) {
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
    <div className='w-full max-w-full space-y-4 sm:space-y-6'>
      <div className='space-y-2 sm:space-y-3'>
        <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
          User Management
        </h1>
        <p className='text-muted-foreground text-sm sm:text-base'>
          View and manage user accounts in the system
        </p>
      </div>

      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4'>
        <div className='flex-1 sm:max-w-md'>
          <UserSearch onSearch={handleSearch} />
        </div>
        <div className='flex-shrink-0'>
          <AddUserButton />
        </div>
      </div>

      <Card className='border-0 sm:border shadow-none sm:shadow-sm'>
        <CardHeader className='px-4 sm:px-6 py-4 sm:py-6'>
          <CardTitle className='text-lg sm:text-xl'>System Users</CardTitle>
          <CardDescription className='text-xs sm:text-sm'>
            {filteredUsers.length === initialUsers.length
              ? `Total users: ${initialUsers.length}`
              : `Showing ${filteredUsers.length} of ${initialUsers.length} users`}
          </CardDescription>
        </CardHeader>
        <CardContent className='px-4 sm:px-6 pb-4 sm:pb-6'>
          <UsersTable users={filteredUsers} currentUserId={currentUserId} />
        </CardContent>
      </Card>
    </div>
  );
}
