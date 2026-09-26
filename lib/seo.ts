import type { Metadata } from "next";
import { SITE_URL } from "./site-url";

export const SITE_NAME = "Ai Workstation";
export const DEFAULT_TITLE =
  "Ai Workstation - Development Environment Control Dashboard";
export const TITLE_TEMPLATE = "%s | Ai Workstation";
export const DEFAULT_DESCRIPTION =
  "Ai Workstation is a mission-control dashboard and container orchestrator for development environments, DeepSeek Harness (DSH), and real-time edge telemetry.";

export const DEFAULT_KEYWORDS = [
  "AI Workstation",
  "DeepSeek Harness",
  "DSH",
  "Docker runtime",
  "Development environment",
  "Container sandbox",
  "Cloudflare Tunnel",
  "GitHub App broker",
  "Zero-PAT authentication",
  "Runtime telemetry",
  "Developer tooling",
  "Remote Linux VPS workstation",
  "Developer shell",
  "AI coding workstation",
];

export const DEFAULT_OG_IMAGE = {
  url: "/opengraph-image.webp",
  width: 1672,
  height: 941,
  alt: "Ai Workstation - Development Environment Control Dashboard",
  type: "image/webp",
};

export const SOCIAL_LINKS = {
  github: "https://github.com/mosabbir-maruf/ai-workstation",
  telegram: "https://t.me/aiws_dev",
};

export interface PageMetadataOptions {
  title?: string;
  description?: string;
  path?: string;
  keywords?: string[];
  type?: "website" | "article";
  image?: {
    url: string;
    width?: number;
    height?: number;
    alt?: string;
  };
  noIndex?: boolean;
}

export const METADATA_BASE = new URL(SITE_URL);

export const DEFAULT_ICONS = {
  icon: [
    { url: "/favicon.ico", sizes: "any" },
    { url: "/icon.svg", type: "image/svg+xml" },
  ],
  apple: [
    { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  ],
};

/**
 * Strips Markdown inline formatting (backticks, bold) for clean search engine schema text.
 */
function cleanSchemaText(text: string): string {
  return text.replace(/`([^`]+)`/g, "$1").trim();
}

/**
 * Canonical helper to generate standard Next.js metadata with OpenGraph,
 * Twitter card, canonical URL, and search engine crawler instructions.
 */
export function createMetadata(options: PageMetadataOptions = {}): Metadata {
  const title = options.title;
  const description = options.description || DEFAULT_DESCRIPTION;
  const path = options.path
    ? options.path.startsWith("/")
      ? options.path
      : `/${options.path}`
    : "";
  const canonicalUrl = `${SITE_URL}${path}`;
  const ogImage = options.image || DEFAULT_OG_IMAGE;
  const keywords = options.keywords
    ? Array.from(new Set([...options.keywords, ...DEFAULT_KEYWORDS]))
    : DEFAULT_KEYWORDS;

  const fullTitle = title
    ? title.includes(SITE_NAME)
      ? title
      : `${title} | ${SITE_NAME}`
    : DEFAULT_TITLE;

  return {
    metadataBase: METADATA_BASE,
    title: title
      ? title
      : {
          default: DEFAULT_TITLE,
          template: TITLE_TEMPLATE,
        },
    description,
    keywords,
    manifest: "/site.webmanifest",
    icons: DEFAULT_ICONS,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: "en_US",
      type: options.type || "website",
      images: [
        {
          url: ogImage.url,
          width: ogImage.width || DEFAULT_OG_IMAGE.width,
          height: ogImage.height || DEFAULT_OG_IMAGE.height,
          alt: ogImage.alt || (typeof title === "string" ? title : DEFAULT_TITLE),
          type: "image/webp",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage.url],
    },
    robots: options.noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };
}

/**
 * Pre-computed, immutable Schema.org Organization JSON-LD
 */
export const ORGANIZATION_SCHEMA = Object.freeze({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  sameAs: [SOCIAL_LINKS.github, SOCIAL_LINKS.telegram],
});

export function getOrganizationSchema() {
  return ORGANIZATION_SCHEMA;
}

/**
 * Pre-computed, immutable Schema.org SoftwareApplication JSON-LD
 */
export const SOFTWARE_APPLICATION_SCHEMA = Object.freeze({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  softwareVersion: "2.1",
  operatingSystem: "Linux, macOS, Windows (WSL2)",
  applicationCategory: "DeveloperApplication",
  description: DEFAULT_DESCRIPTION,
  url: SITE_URL,
  image: `${SITE_URL}${DEFAULT_OG_IMAGE.url}`,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
});

export function getSoftwareApplicationSchema() {
  return SOFTWARE_APPLICATION_SCHEMA;
}

/**
 * Pre-computed, immutable Schema.org WebSite JSON-LD with search action
 */
export const WEBSITE_SCHEMA = Object.freeze({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/docs?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
});

export function getWebSiteSchema() {
  return WEBSITE_SCHEMA;
}

/**
 * Schema.org FAQPage JSON-LD for rich accordion search snippets
 */
export function getFaqSchema(
  items: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: cleanSchemaText(item.answer),
      },
    })),
  };
}

/**
 * Schema.org TechArticle JSON-LD for documentation pages
 */
export function getTechArticleSchema(doc: {
  title: string;
  description?: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: doc.title,
    description: doc.description || DEFAULT_DESCRIPTION,
    url: `${SITE_URL}${doc.url}`,
    image: `${SITE_URL}${DEFAULT_OG_IMAGE.url}`,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon.svg`,
      },
    },
  };
}

/**
 * Schema.org BreadcrumbList JSON-LD
 */
export function getBreadcrumbSchema(
  breadcrumbs: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.url}`,
    })),
  };
}
