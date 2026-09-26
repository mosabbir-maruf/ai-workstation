import type { ComponentType } from "react";
import { Cloudflare } from "@/components/brands/cloudflare";
import { DeepSeek } from "@/components/brands/deepseek";
import { Docker } from "@/components/brands/docker";
import { GitHubBrand } from "@/components/brands/github";
import { Harness } from "@/components/brands/harness";
import { Linux } from "@/components/brands/linux";
import { Nextjs } from "@/components/brands/nextjs";
import { Script } from "@/components/brands/script";

function partnerHref(origin: string, term: string) {
  try {
    const url = new URL(origin);
    url.searchParams.set("utm_source", "workstation");
    url.searchParams.set("utm_medium", "website");
    url.searchParams.set("utm_campaign", "ecosystem");
    url.searchParams.set("utm_content", "partners");
    url.searchParams.set("utm_term", term);
    return url.toString();
  } catch {
    return origin;
  }
}

export const partnerLink = partnerHref(
  "https://github.com",
  "ecosystem-partner"
);

interface PartnerLogoProps {
  className?: string;
}

export interface Partner {
  id: string;
  name: string;
  href: string;
  Logo: ComponentType<PartnerLogoProps>;
}

export type PartnerSlot = Partner | "placeholder";

/** Core infrastructure partners (Top row, 3 slots) */
export const premiumPartnerSlots: PartnerSlot[] = [
  {
    id: "linux",
    name: "Linux",
    href: partnerHref("https://www.kernel.org", "core-linux"),
    Logo: Linux,
  },
  {
    id: "docker",
    name: "Docker",
    href: partnerHref("https://www.docker.com", "core-docker"),
    Logo: Docker,
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    href: partnerHref("https://www.cloudflare.com", "core-cloudflare"),
    Logo: Cloudflare,
  },
];

/** Ecosystem & platform partners (Bottom row, 5 slots) */
export const silverPartnerSlots: PartnerSlot[] = [
  {
    id: "github",
    name: "GitHub",
    href: partnerHref("https://github.com", "ecosystem-github"),
    Logo: GitHubBrand,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    href: partnerHref("https://www.deepseek.com", "ecosystem-deepseek"),
    Logo: DeepSeek,
  },
  {
    id: "harness",
    name: "Harness",
    href: partnerHref("https://harness.io", "ecosystem-harness"),
    Logo: Harness,
  },
  {
    id: "nextjs",
    name: "Next.js",
    href: partnerHref("https://nextjs.org", "ecosystem-nextjs"),
    Logo: Nextjs,
  },
  {
    id: "script",
    name: "Script",
    href: partnerHref("https://www.gnu.org/software/bash", "ecosystem-script"),
    Logo: Script,
  },
];

export interface PastPartner {
  id: string;
  name: string;
  href: string;
}

export const pastPartners: PastPartner[] = [];

export const partnerTierLabels = {
  premium: "Core infrastructure",
  silver: "Ecosystem partner",
} as const;

export type PartnerTier = keyof typeof partnerTierLabels;

export const premiumLogoClassName =
  "h-10 md:h-12 w-auto max-w-[240px] text-foreground";

export const silverLogoClassName =
  "h-7 md:h-8.5 w-auto max-w-[180px] text-foreground";
