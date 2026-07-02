# Design Prompt: Rodinný Nákupný Zoznam (Family Shopping List)

A copy-paste-ready prompt for the **Claude design app** to generate a designed, interactive
mobile-first UI for this app, built with **Chakra UI**. The app itself is already built,
tested, and live at https://zoznam-nakupny.web.app — this prompt is for exploring visual/UX
direction, not for defining new features. Source of truth for behavior: `PLAN.md` and
`CONTEXT.md` in this repo.

Copy everything between the `--- PROMPT START ---` and `--- PROMPT END ---` markers into the
Claude design app.

--- PROMPT START ---

Design and build an interactive, mobile-first UI mockup for a small **family shopping list**
app, using **React and Chakra UI**. This is a private daily-use utility for one household (2–6
people who fully trust each other) — no landing page, no marketing surface, no roles or
permissions. It's used in short frequent bursts, one-handed on a phone: adding an item while
cooking, checking things off while walking a store's aisles, reordering the list before
leaving home. It should feel fast, calm, warm, and confident — like a well-made kitchen tool,
not enterprise SaaS. The interface language is Slovak (keep the Slovak UI strings below
exactly as written); your notes/explanations to me can be in English.

## Screens to design

1. **Sign-in** — a single "Prihlásiť sa cez Google" (Sign in with Google) action. Nothing
   else: no email/password, no alternatives, no signup form.
2. **Join the family (invite code)** — a signed-in user who isn't a member yet enters a static
   invite code (shared out-of-band). One text input + confirm. Show a clear error state for an
   invalid code that keeps them on this screen.
3. **Empty state — no lists yet** — a fresh member has zero lists. Show a friendly empty state
   whose single obvious action is "Vytvoriť zoznam" (create a list). No list is auto-created;
   don't leave a dead-end blank screen.
4. **Main item screen** — the heart of the app. It has:
   - A header showing the current list's name, doubling as the control to open the list
     switcher (see below).
   - A persistent, always-reachable add-item row (sticky top or bottom) — an `Input` +
     `IconButton` — so adding never requires scrolling or opening a menu.
   - Two sections: **"Na kúpu"** (active, to buy) and **"Hotové"** (done). Active items are
     ordered by manual drag position; done items are ordered by completion time (pick most-
     recent-first or last, but be consistent). Each has its own empty state.
   - A "Vymazať hotové" (clear all done) action for the Hotové section.
5. **List switcher (overlay / bottom-sheet `Drawer`)** — opened from the header, it must NOT
   feel like navigating to another page. It lists all the family's named lists (e.g. "Týždenný
   nákup", "Nákup do Kauflandu"), lets you switch, create, rename, and delete a list. Deleting
   a list is permanent and removes all its items — make it feel deliberate/confirmable without
   a heavy blocking dialog.

## Key interactions to convey

- **Add item**: instant, optimistic — the item appears immediately, no spinner.
- **Check / uncheck**: a Chakra `Checkbox`-style toggle; checking moves an item from "Na kúpu"
  to "Hotové" and should feel immediate and satisfying; unchecking returns it to the bottom of
  "Na kúpu". No loading state for either.
- **Drag-to-reorder**: active section only. Give each active item a clear, touch-friendly drag
  handle — this is the most tactile interaction in the app and deserves confident feedback
  (lift/shadow/placeholder while dragging). Done items are never manually reordered.
- **Realtime / shared feel**: everything syncs live across family members' devices. Convey
  "this list is alive and shared" subtly — do not spam toasts for every remote change.
- **States**: design the empty, loading, and error states for: not-yet-a-member, no lists,
  empty active list, empty done section, invalid invite code, and offline/connection loss.

## User stories to design for

1. As a family member in the kitchen, I want to quickly add "mlieko" without opening any menu
   first, so I don't forget it.
2. As a family member heading to the store, I want to reorder items by dragging so they match
   the order I'll walk the aisles.
3. As a family member shopping, I want checking an item off to feel immediate and satisfying,
   and to see what's still left at a glance.
4. As a family member who checked something off by mistake, I want to uncheck it and have it
   land back in the active list without hunting for it.
5. As a family member back home, I want to clear everything marked done in one tap so the list
   is ready for next time.
6. As a new household member, I want to join with a code someone texted me and immediately
   understand I need to create a list.
7. As a family that shops at more than one store, I want to switch between "Týždenný nákup" and
   "Lekáreň" lists without feeling like I left the app.
8. As any family member, I want my partner's addition to appear live while we're both in the
   kitchen, without refreshing.

## Explicit non-goals — do NOT design these

- No roles, permissions, or "owner/admin" concept — every member is identical.
- No categories, quantities, or structured item fields — items are free text.
- No activity feed, notifications, comments, or social features beyond the invite code.
- No desktop-first layout, no landing/marketing page, no multi-family switching.

## Build / library instructions

- Use **Chakra UI** components throughout — don't hand-roll raw unstyled markup. Map the app's
  patterns to Chakra primitives:
  - Layout & sections → `Box`, `Flex`, `Stack`/`VStack`.
  - Add-item row → `Input` + `IconButton`.
  - Item toggle → `Checkbox` (or a custom Chakra-styled check control).
  - Row actions (delete, drag handle) → compact `IconButton`s with icons.
  - List switcher → Chakra `Drawer` presented as a bottom sheet.
  - Confirmable delete → a lightweight `Popover`/inline confirm, not a full-screen modal.
- **Customize the Chakra theme** — define a warm, distinctive palette, rounded radii, and a
  friendly type scale. Do NOT ship the default Chakra gray/blue look; this app should have its
  own personality.
- Prioritize **large touch targets**, high contrast for quick glances, and a layout that stays
  legible and operable one-handed. Never add steps to the two most frequent actions — adding
  an item and checking one off.

## Output

Produce an interactive, mobile-phone-sized mockup (single artifact is fine) that covers the
five screens above, with the list-switcher `Drawer` and the drag-reorder interaction working
well enough to feel the UX. Prioritize the main item screen. Where a real backend would be
involved, use local mock state so the interactions (add / check / uncheck / reorder / switch
list / clear done) are actually clickable.

--- PROMPT END ---

## Notes

- The prompt intentionally omits the real stack wiring (Vite, Firebase/Firestore, auth
  internals) so the design pass stays focused on look, feel, and interaction. React + Chakra UI
  are named on purpose because they're the design output target.
- The live invite code is a bearer credential and is deliberately **not** included here.
