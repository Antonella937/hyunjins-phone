---
name: Music generation runtime boundary
description: Why agent-side music tools cannot power the phone's in-app generation
---

Agent-side music generation callbacks can produce assets during development but cannot be invoked by the published phone. A real in-app Generate Track action needs a separately configured server-side music provider; until then, show the disconnected state and never create a saved track that claims to contain generated audio.

**Why:** Replit's music-generation tooling available to the agent is not a runtime API for the app. Treating an agent-created sample as if the user generated it in-app would misrepresent provider availability and bypass the user's explicit confirmation step.

**How to apply:** For future changes to Original Tracks, keep previews and confirmed audio distinct and validate playable bytes from a runtime provider. Never substitute text-to-speech or pre-generated samples for a completed Generate Track action.