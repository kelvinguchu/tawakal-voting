"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserSearchProps {
  onSearch: (query: string) => void;
}

export function UserSearch({ onSearch }: UserSearchProps) {
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
    <div className='relative w-64'>
      <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
      <Input
        placeholder='Search users...'
        className='pl-8'
        value={searchQuery}
        onChange={handleSearch}
      />
      {searchQuery && (
        <Button
          variant='ghost'
          size='icon'
          className='absolute right-0 top-0 h-9 w-9 rounded-md'
          onClick={clearSearch}>
          <X className='h-4 w-4' />
          <span className='sr-only'>Clear search</span>
        </Button>
      )}
    </div>
  );
}
