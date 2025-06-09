"use client";

import { useRouter } from "next/navigation";
import { useNavigation } from "@/components/providers/navigation-provider";

export function useLoadingForm() {
  const router = useRouter();
  const { startLoading, stopLoading } = useNavigation();

  const navigateWithLoading = (path: string) => {
    startLoading();
    router.push(path);
  };

  const handleFormSubmission = async (
    submitFunction: () => Promise<void>,
    onSuccess?: () => void,
    redirectPath?: string
  ) => {
    startLoading();

    try {
      await submitFunction();

      if (onSuccess) {
        onSuccess();
      }

      if (redirectPath) {
        router.push(redirectPath);
        // Don't stop loading here - let the navigation provider handle it
      } else {
        stopLoading();
      }
    } catch (error) {
      stopLoading();
      throw error;
    }
  };

  return {
    navigateWithLoading,
    handleFormSubmission,
    startLoading,
    stopLoading,
  };
}
