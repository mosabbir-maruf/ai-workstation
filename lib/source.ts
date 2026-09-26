import { loader } from "fumadocs-core/source";
import { docs } from "@/.source";

// Get the source - handle both function and direct array cases
const mdxSource = docs.toFumadocsSource();
const files = mdxSource.files;

export const source = loader({
  baseUrl: "/docs",
  source: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    files: typeof files === "function" ? (files as any)() : files,
  },
});
