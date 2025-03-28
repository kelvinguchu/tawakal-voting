"use client";

import { motion } from "framer-motion";
import { User } from "@/lib/types/database";

interface DashboardHeaderProps {
  userData: User | null;
}

export function DashboardHeader(  { userData }: DashboardHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className='border-b pb-4 mb-6'>
      <h1 className='text-2xl font-semibold text-tawakal-blue'>
        Welcome, {userData?.first_name} {userData?.last_name}
      </h1>
    </motion.div>
  );
}
