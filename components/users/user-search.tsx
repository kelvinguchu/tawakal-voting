"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserSearchProps {
  onSearch: (query: string) => void;
}

export function UserSearch({ onSearch }: Readonly<UserSearchProps>) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const clearSearch = () => {
    setSearchQuery("");
    onSearch("");
  };

  return (
    <div className='relative w-full sm:w-64'>
      <Search className='absolute left-2 sm:left-3 top-2.5 sm:top-3 h-4 w-4 text-muted-foreground' />
      <Input
        placeholder='Search users...'
        className='pl-8 sm:pl-9 h-9 sm:h-10 text-sm sm:text-base'
        value={searchQuery}
        onChange={handleSearch}
      />
      {searchQuery && (
        <Button
          variant='ghost'
          size='icon'
          className='absolute right-0 top-0 h-9 w-9 sm:h-10 sm:w-10 rounded-md'
          onClick={clearSearch}>
          <X className='h-3 w-3 sm:h-4 sm:w-4' />
          <span className='sr-only'>Clear search</span>
        </Button>
      )}
    </div>
  );
}
