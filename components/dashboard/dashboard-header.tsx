"use client";

import { motion } from "framer-motion";

export function DashboardHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}>
      <div className='relative'>
        <h1 className='text-4xl font-bold tracking-tight relative z-10'>
          <span className='bg-clip-text text-transparent bg-gradient-to-r from-tawakal-green via-tawakal-blue to-tawakal-red animate-gradient-x'>
            Dashboard
          </span>
        </h1>
        <div className='absolute -left-2 -top-1 w-12 h-12 rounded-full bg-tawakal-green/10 blur-xl z-0'></div>
      </div>

      <motion.p
        className='text-muted-foreground mt-2'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}>
        Welcome to the internal voting system for company polls and decisions.
      </motion.p>
    </motion.div>
  );
}
