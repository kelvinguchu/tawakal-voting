"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: 0.6,
    },
  },
};

const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.8 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4 } },
};

export function HelpCard() {
  return (
    <motion.div initial='hidden' animate='visible' variants={cardVariants}>
      <Card className='overflow-hidden bg-white/70 dark:bg-black/40 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-tawakal-red/10 transition-all duration-300'>
        <div className='absolute inset-0 bg-gradient-to-r from-tawakal-red/5 to-tawakal-blue/5 rounded-lg -z-10'></div>

        <CardHeader className='flex flex-row items-center justify-between pb-2'>
          <div>
            <CardTitle className='text-tawakal-red'>
              Help & Information
            </CardTitle>
            <CardDescription>
              Learn how to use the voting system
            </CardDescription>
          </div>
          <HelpCircle className='h-5 w-5 text-tawakal-red' />
        </CardHeader>

        <CardContent>
          <motion.div
            className='grid gap-4 md:grid-cols-2'
            variants={contentVariants}
            initial='hidden'
            animate='visible'>
            <motion.div
              variants={itemVariants}
              className='p-4 rounded-lg bg-white/40 dark:bg-black/20 backdrop-blur-sm border border-white/10'>
              <h3 className='text-lg font-medium text-tawakal-green'>
                How to Vote
              </h3>
              <p className='text-sm text-muted-foreground'>
                Browse active polls and cast your vote. Each poll allows one
                vote per user. Your votes are anonymous and secure.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className='p-4 rounded-lg bg-white/40 dark:bg-black/20 backdrop-blur-sm border border-white/10'>
              <h3 className='text-lg font-medium text-tawakal-blue'>
                Poll Lifecycle
              </h3>
              <p className='text-sm text-muted-foreground'>
                Polls move through scheduled, active, and closed states. Results
                are available once a poll is closed. Only administrators can
                create and manage polls.
              </p>
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
