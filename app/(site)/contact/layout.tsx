import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Contact & Community Support",
  description:
    "Get support, join community discussions, report issues, and connect with the Ai Workstation engineering team.",
  path: "/contact",
});

export default function ContactLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
