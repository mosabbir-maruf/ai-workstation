import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/json-ld";
import { FAQ_ITEMS } from "@/lib/faq-data";
import { createMetadata, getFaqSchema } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "FAQ & Technical Specifications",
  description:
    "Frequently asked questions and technical specifications for Ai Workstation architecture, DSH harness, GitHub App auth, and Cloudflare tunnels.",
  path: "/faq",
});

export default function FaqLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd schema={getFaqSchema(FAQ_ITEMS)} />
      {children}
    </>
  );
}
