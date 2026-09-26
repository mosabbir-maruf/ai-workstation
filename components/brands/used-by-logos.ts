import type { ComponentType } from "react";
import { Cloudflare } from "./cloudflare";
import { DeepSeek } from "./deepseek";
import { Docker } from "./docker";
import { GitHubBrand } from "./github";
import { Harness } from "./harness";
import { Linux } from "./linux";
import { Nextjs } from "./nextjs";
import { Script } from "./script";

interface BrandLogoProps {
  className?: string;
}

export interface UsedByLogo {
  id: string;
  name: string;
  href: string;
  Logo: ComponentType<BrandLogoProps>;
}

function toolHref(origin: string, brand: string) {
  try {
    const url = new URL(origin);
    url.searchParams.set("utm_source", "ai-workstation");
    url.searchParams.set("utm_medium", "website");
    url.searchParams.set("utm_campaign", "homepage");
    url.searchParams.set("utm_term", brand);
    return url.toString();
  } catch {
    return origin;
  }
}

/** Ecosystem partners backed by open infrastructure and platform partners */
export const usedByLogos: UsedByLogo[] = [
  {
    id: "linux",
    name: "Linux",
    href: toolHref("https://www.kernel.org", "linux"),
    Logo: Linux,
  },
  {
    id: "docker",
    name: "Docker",
    href: toolHref("https://www.docker.com", "docker"),
    Logo: Docker,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    href: toolHref("https://www.deepseek.com", "deepseek"),
    Logo: DeepSeek,
  },
  {
    id: "harness",
    name: "Harness",
    href: toolHref("https://harness.io", "harness"),
    Logo: Harness,
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    href: toolHref("https://www.cloudflare.com", "cloudflare"),
    Logo: Cloudflare,
  },
  {
    id: "github",
    name: "GitHub",
    href: toolHref("https://github.com", "github"),
    Logo: GitHubBrand,
  },
  {
    id: "script",
    name: "Script",
    href: toolHref("https://www.gnu.org/software/bash", "script"),
    Logo: Script,
  },
  {
    id: "nextjs",
    name: "Next.js",
    href: toolHref("https://nextjs.org", "nextjs"),
    Logo: Nextjs,
  },
];

export const usedByLogoClassName =
  "h-7 sm:h-8 w-auto max-h-[85%] max-w-[95%] text-muted-foreground transition-colors duration-[180ms] ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:text-foreground";
