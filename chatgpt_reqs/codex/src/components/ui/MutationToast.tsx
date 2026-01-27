"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

type MutationToastProps = {
  param?: string;
  messages: Record<string, string>;
};

export default function MutationToast({
  param = "toast",
  messages,
}: MutationToastProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const value = searchParams.get(param);
    if (!value) {
      return;
    }
    const message = messages[value];
    if (message) {
      toast.success(message);
    }
    const next = new URLSearchParams(searchParams);
    next.delete(param);
    const query = next.toString();
    const nextUrl = query ? `?${query}` : window.location.pathname;
    router.replace(nextUrl);
  }, [messages, param, router, searchParams]);

  return null;
}
