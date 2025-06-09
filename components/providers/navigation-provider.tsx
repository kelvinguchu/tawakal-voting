"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { usePathname } from "next/navigation";
import { NavigationLoader } from "@/components/ui/navigation-loader";

interface NavigationContextType {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  // Auto-stop loading when pathname changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 150); // Small delay to ensure smooth transition

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <NavigationContext.Provider
      value={{ isLoading, startLoading, stopLoading }}>
      {children}
      <NavigationLoader isLoading={isLoading} />
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
