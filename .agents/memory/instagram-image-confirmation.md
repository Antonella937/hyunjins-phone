---
name: Instagram image confirmation
description: Why generated images stay preview-only until explicitly accepted, while older Gallery photos remain usable.
---

Treat AI-generated Instagram images as previews until the user chooses **Use Image**. Only then persist the bytes and attach a stable image reference to the post or Story. Cancel and Regenerate must not leave permanent image files.

**Why:** The user explicitly requires confirmation before saving; persisting every preview creates orphaned files, while storing provider-sized image data in the phone's browser record can exhaust local storage.

**How to apply:** When extending image generation or other proposal flows, keep preview data transient, upload on explicit approval, and store a stable image reference in the existing phone record. Continue reading legacy Gallery data URLs without resetting old content; convert a selected legacy image only when it is used.