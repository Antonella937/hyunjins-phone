---
name: Raw audio OpenAPI contract
description: A codegen limitation when declaring raw binary upload bodies for this workspace.
---

The workspace's OpenAPI generator turns a `format: binary` request schema into a `Blob` type in the generated server-side schema library. That library currently does not include the DOM type declarations, so its typecheck fails.

**Why:** A raw audio upload contract using `type: string, format: binary` generated successfully but failed the subsequent library build because `Blob` was unknown. The server can handle octet-stream bytes directly, but the generated type cannot currently express that body without changing its TypeScript environment.

**How to apply:** When adding raw binary requests, either explicitly support DOM `Blob` in the generated library build or document octet-stream bytes without `format: binary` and use a validated raw request handler. Do not assume codegen success means the library typecheck succeeds.