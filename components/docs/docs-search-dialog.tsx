"use client";

import type { DefaultSearchDialogProps } from "fumadocs-ui/components/dialog/search-default";
import { lazy, Suspense } from "react";

const DocsSearchDialogImpl = lazy(
  () => import("./docs-search-dialog-content")
);

export function DocsSearchDialog(props: DefaultSearchDialogProps) {
  if (!props.open) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <DocsSearchDialogImpl {...props} />
    </Suspense>
  );
}
