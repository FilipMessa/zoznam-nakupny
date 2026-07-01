# Context

## Glossary

**Family** — The single household using this app. This is a single-tenant deployment: one Firebase project serves exactly one Family, forever. `familyId` is a fixed constant in code, not a value looked up or chosen at runtime. There is no concept of creating a second Family within the same deployment; a second family would require a separate Firebase project deployment.

**Member** — A user who has joined the Family via a valid invite code. All Members are equal: there is no owner/admin role, and any Member can create, check, uncheck, or delete any Item. Removing a Member is not an in-app action in v1 — it's a manual Firestore console operation.

**Shopping List** (or **List**) — A named, family-wide collection of Items (e.g., "Weekly groceries", "Costco run"). A Family has one set of Members but can have several Lists. Every Member can see and act on every List — Lists are not private to a Member. Items nest under a List, not directly under the Family.
