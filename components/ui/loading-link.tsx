"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { useNavigation } from "@/components/providers/navigation-provider";

interface LoadingLinkProps extends React.ComponentProps<typeof Link> {
  children: React.ReactNode;
  className?: string;
}

export const LoadingLink = forwardRef<HTMLAnchorElement, LoadingLinkProps>(
  ({ href, children, onClick, ...props }, ref) => {
    const { startLoading } = useNavigation();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Only start loading for internal navigation
      if (typeof href === "string" && href.startsWith("/")) {
        startLoading();
      }

      // Call original onClick if provided
      if (onClick) {
        onClick(e);
      }
    };

    return (
      <Link ref={ref} href={href} onClick={handleClick} {...props}>
        {children}
      </Link>
    );
  }
);

LoadingLink.displayName = "LoadingLink";
