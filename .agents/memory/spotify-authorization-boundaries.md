---
name: Spotify authorization boundaries
description: Why this phone treats Spotify credentials and OAuth callback environments differently from its local content.
---

Keep Spotify refresh credentials in encrypted, first-party, HttpOnly cookies rather than the phone's local content store. Only short-lived access tokens needed by the Web Playback SDK may reach the browser's memory. Treat development and production callback URLs as distinct Spotify Developer App registrations.

**Why:** The phone's local content is editable browser data, unsuitable for account credentials. Spotify requires an exact redirect URI match, so a callback registered for the published HTTPS app does not authorize a preview on a separate development host. Spotify refresh grants can also expire after six months and require reauthorization.

**How to apply:** When changing Spotify auth, player initialization, deployment domains, or settings copy, preserve the cookie/browser boundary and display the exact production callback independently of any optional development callback. Do not infer a successful account connection or audible playback from the existence of configuration alone.