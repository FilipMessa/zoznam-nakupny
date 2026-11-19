# Context

## Glossary

**Family** — The single household using this app. This is a single-tenant deployment: one Firebase project serves exactly one Family, forever. `familyId` is a fixed constant in code, not a value looked up or chosen at runtime. There is no concept of creating a second Family within the same deployment; a second family would require a separate Firebase project deployment.

**Member** — A user who has joined the Family via a valid invite code. All Members are equal: there is no owner/admin role, and any Member can create, check, uncheck, delete, or move any Item (including between Lists). Removing a Member is not an in-app action in v1 — it's a manual Firestore console operation.

**Shopping List** (or **List**) — A named, family-wide collection of Items (e.g., "Weekly groceries", "Costco run"). A Family has one set of Members but can have several Lists. Every Member can see and act on every List — Lists are not private to a Member. Items nest under a List, not directly under the Family.

**Origin List** — The List a given Item belongs to, used specifically when an Item is shown outside the context of its own List (e.g. in the All Lists screen's combined Done section, where Items from several Lists are shown together). Every Item has exactly one Origin List for its whole lifetime — Items are never shared between Lists, only moved (see cross-list move in `docs/adr/0003-transaction-for-cross-list-item-move.md`).

**Add Target** — The single List currently selected, on the All Lists screen, as the destination for new Items added via the pinned add-item input. At most one List is the Add Target at a time; none is selected by default when the screen opens. Distinct from Origin List: Add Target is a transient UI selection the Member makes, not an intrinsic property of an Item.
_Avoid_: "selected list" (ambiguous with the single-list screen's own list-switcher selection).
