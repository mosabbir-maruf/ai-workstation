import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { findNeighbour } from "fumadocs-core/server";
import type { TOCItemType } from "fumadocs-core/toc";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import { CopyPageButton } from "@/components/docs/copy-page-button";
import { PageFooter } from "@/components/docs/page-footer";
import { TableOfContents } from "@/components/docs/toc";
import { source } from "@/lib/source";

import { JsonLd } from "@/components/seo/json-ld";
import {
  createMetadata,
  getBreadcrumbSchema,
  getTechArticleSchema,
} from "@/lib/seo";

// Extended page data types from fumadocs-mdx
interface PageData {
  title: string;
  description?: string;
  body: ComponentType<Record<string, unknown>>;
  toc: TOCItemType[];
  full?: boolean;
}

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) {
    notFound();
  }

  const data = page.data as PageData;
  const MDX = data.body;
  const neighbours = findNeighbour(source.pageTree, page.url);

  // Read raw MDX content for copy functionality
  const slugPath = params.slug?.join("/") || "index";
  const mdxPath = join(process.cwd(), "content/docs", `${slugPath}.mdx`);
  let rawContent = "";
  try {
    rawContent = await readFile(mdxPath, "utf-8");
  } catch {
    // Fallback if file read fails
    rawContent = "";
  }

  const breadcrumbs = [
    { name: "Docs", url: "/docs" },
    ...(params.slug && params.slug.length > 0 && params.slug[0] !== "index"
      ? [{ name: data.title, url: page.url }]
      : []),
  ];

  const schemas = [
    getTechArticleSchema({
      title: data.title,
      description: data.description,
      url: page.url,
    }),
    getBreadcrumbSchema(breadcrumbs),
  ];

  return (
    <div className="flex w-full min-w-0 justify-center">
      <JsonLd schema={schemas} />
      <article className="min-w-0 w-full max-w-[790px] px-4 pt-6 pb-12 sm:px-8 sm:pt-12 md:px-10 lg:pt-24 lg:pb-16">
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start sm:gap-4">
            <div className="min-w-0">
              <h1 className="m-0 font-bold text-2xl text-foreground leading-tight sm:text-3xl">
                {data.title}
              </h1>
              {data.description && (
                <p className="mt-2 text-base text-muted-foreground sm:text-lg">
                  {data.description}
                </p>
              )}
            </div>
            <CopyPageButton
              content={rawContent}
              title={data.title}
              url={page.url}
            />
          </div>
        </header>
        <div className="prose prose-neutral dark:prose-invert max-w-none min-w-0 overflow-x-hidden [&_pre]:overflow-x-auto [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto">
          <MDX components={defaultMdxComponents} />
        </div>
        <PageFooter next={neighbours.next} previous={neighbours.previous} />
      </article>
      <TableOfContents items={data.toc} />
    </div>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) {
    notFound();
  }

  return createMetadata({
    title: page.data.title,
    description: page.data.description,
    path: page.url,
    type: "article",
  });
}
