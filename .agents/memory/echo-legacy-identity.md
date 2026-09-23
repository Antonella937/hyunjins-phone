---
name: Echo legacy identity
description: Why Echo displays the existing c1 Contact as Nela without renaming the Contact globally.
---

Treat legacy Echo references to Antonella/@antocastillo as the existing c1 Contact and show Nela/@nela within Echo. Keep the Contact record itself unchanged unless the user edits Contacts; if its display name later changes from Antonella, Echo should use that updated name.

**Why:** The user wants the outdated Echo identity corrected without creating a duplicate Contact or changing identity data elsewhere in the phone. Persisted older Echo posts may still lack a Contact link, so changing only seed data would leave existing users with the outdated display.

**How to apply:** Resolve old Echo records and notifications at the Echo display boundary, link new Echo activity to c1, and preserve user-edited Echo handles. Do not reset or rewrite the shared phone store to perform this migration.