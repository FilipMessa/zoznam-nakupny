> Superseded by [docs/conventions.md](./conventions.md), which is now the authority for layering and naming (`*Service.ts` = pure logic, `*Api.ts` = Firebase I/O). Below is the historical working spec; its file names and backlog paths predate that rename.

# Spec: split presentation and business layers (agentic loop task)

This is the working spec for an agentic loop that refactors existing screens/rows
so React components stay purely presentational and all state orchestration lives
in custom hooks. It is designed to survive context resets between loop
iterations — the **Backlog** checklist at the bottom is the source of truth for
what's done. Update it (check the box, note the commit) at the end of every
iteration before stopping.

## Why

The app works but was built quickly ("vibe coded") without a firm line between
"what renders" and "what the app does". Several screen/row components mix
`useEffect` orchestration, async Firestore calls, and multi-field state
machines directly into JSX. This makes them hard to test in isolation and hard
to reason about independent of rendering. Goal: every `.tsx` file is
props-in/JSX-out; every stateful behavior is a hook; every hook has one job.

This is an internal refactor only. **No component's props or rendered output
change.** Existing component tests should pass unmodified (aside from updated
import paths if a hook moves). If a step seems to require a behavior or prop
change to do cleanly, stop and ask — don't guess.

## Target architecture

**Presentational layer** (`*.tsx` in `components/`):
- Props in, JSX out.
- May keep local state only if it is a single ephemeral UI concern with no
  side effects and no async: a controlled input's current value, hover state,
  focus state. That's it.
- May keep a plain synchronous handler if it does nothing but read local
  state and call a prop callback (e.g. validate-and-clear-then-`onSubmit`).
- Must **not** contain: `useEffect`, `try/catch`, `await`, calls into
  `*Service.ts`/`*Api.ts` (formerly `*Crud.ts`), or state that other components need to know about
  (e.g. "which row is currently open/editing").

**Business layer** (`.ts`, not `.tsx`):
- One custom hook = one intent. Example intents already visible in the
  codebase: "coordinate which row's swipe is open", "manage edit-mode for an
  item", "scroll a newly added item into view", "submit a new item with error
  handling".
- A **screen composes** its single-intent hooks inside one `use<ScreenName>`
  hook (e.g. `useShoppingListScreen`, `useListsScreen`) that calls the smaller
  hooks internally and returns a flat object of values/handlers the component
  spreads into JSX. The component itself calls only this one composing hook.
- Hooks call pure logic (`itemService.ts`, `listService.ts`) and Firebase I/O
  wrappers (`itemApi.ts`, `listApi.ts`, `inviteApi.ts`)
  directly — don't introduce a new layer between hooks and services.
- File location: colocate single-intent hooks and the composing hook at the
  feature root, next to the existing `useItems.ts` / `useLists.ts` /
  `useSelectedListId.ts` (i.e. `src/features/<feature>/use<Thing>.ts`), not
  nested under `components/`. This matches the existing convention.
- Naming: `use<Verb/Noun phrase describing the one intent>`, e.g.
  `useSwipeRowCoordination`, `useItemEditing`, `useScrollNewItemIntoView`.

**Extraction rule of thumb** — a piece of component code *must* move into a
hook if it has any of:
- a `useEffect`
- an `async` function or anything calling a `Service`/`Crud` function
- a `try/catch`
- two or more pieces of state that must stay in sync with each other (a
  mini state machine), or state one component needs to expose to a sibling
  (e.g. `openSwipeItemId` shared across rows)

It *may* stay in the component if it's a single controlled field's value
with a synchronous, side-effect-free handler that only calls a prop. Tier 3
below covers these — extract them too for consistency, but they're lower
priority and lower risk than Tiers 1–2.

## Iteration contract

Each loop iteration:

1. Pick the next unchecked item from **Backlog** (top to bottom within a
   tier; finish a tier before starting the next).
2. Extract the hook(s) named in that item. Component keeps identical props
   and rendered output.
3. Run `npm run lint`, `npm run test`, `npm run build`. All must pass. Fix
   forward; don't skip or weaken a check to get green.
4. Before committing, spawn a separate review agent (Claude Sonnet, medium
   effort — use the `/code-review` skill/convention at medium) against the
   working diff. It should confirm: zero behavior change, one-intent-per-hook
   is actually respected (not just moved wholesale into one grab-bag hook),
   no stray debug code, tests untouched except import paths. If it reports a
   blocking finding, fix and re-review before committing.
5. Commit **that one component's extraction only** (tightly coupled
   pairs that share a hook, like `ActiveItemRow`/`DoneItemRow`, may land in
   one commit — see Backlog notes). Commit message:
   `refactor: extract <hookNames> from <Component>`.
6. Check the box in Backlog, note the commit hash, then stop this iteration.

Do not batch multiple unrelated components into one commit. Do not move on to
the next tier while items remain unchecked in an earlier tier unless a
Backlog note says two items are coupled.

## Guardrails / stop conditions

- Don't touch `firestore.rules`, `*.integration.test.ts`, or `*Service.ts`/
  `*Crud.ts` function signatures — this refactor moves state/effects, not I/O
  contracts. If a hook extraction seems to need a service signature change,
  stop and ask.
- If a component's current behavior looks like a latent bug while you're
  extracting it (not what you're there to fix), don't fix it silently —
  note it in the Backlog item and leave behavior unchanged.
- If two components' logic look like they should merge into a shared hook
  beyond what's already noted below, propose it in the commit/PR description
  rather than deviating from the listed plan silently.

## Definition of done

Every Backlog item checked off, full `npm run lint && npm run test && npm run build`
green, no component left with a `useEffect`/`async`/`try-catch`/Service call
inside its `.tsx` file except where Tier 3 explicitly allows a trivial local
field to remain.

## Backlog

### Tier 1 — effects, cross-component coordination, multi-field state machines

- [x] (`6db417e`) `src/features/items/components/ShoppingListScreen.tsx` — extract into
      `useShoppingListScreen` (composing) built from:
      `useScrollNewItemIntoView` (the `prevActiveIdsRef`/`scrollAfterAdd`
      effect), `useSwipeRowRegistry` (the `openSwipeItemId` +
      document-level `pointerdown` effect), `useItemEditing`
      (`editingItemId` + start/submit/cancel), and the add/check/uncheck/
      reorder/delete/clear-done async handlers (can live in the composing
      hook or a `useItemActions` hook — reviewer's call on further split).
- [x] (`1a6244c`) `src/features/items/components/ActiveItemRow.tsx` +
      `src/features/items/components/DoneItemRow.tsx` (couple these — they
      duplicate the same swipe-open/edit-close effect pattern) — extract a
      shared `useSwipeActions`-adjacent hook, e.g. `useRowSwipeSync`, plus
      `useItemEditForm` for `ActiveItemRow`'s inline edit
      (input ref, cancelledRef, trySubmitEdit/keydown/blur/submit). Single
      commit covering both files.
- [x] (`e4a9627`; characterization tests added first in `2196f55`) `src/features/lists/components/ListsScreen.tsx` — extract into
      `useListsScreen` (composing) built from `useCreateListForm`
      (`showCreateForm`/`createPending`/`createError` + `handleCreate`/
      `handleCancelCreate`), `useRenameListForm` (equivalent rename triplet),
      and `useDeleteListFlow` (`showDeleteConfirm` + `handleDelete`). The
      `switcherOpen` toggle is a candidate for staying local if nothing else
      needs it — confirm during extraction.
      *Outcome:* `switcherOpen` lives in `useListsScreen` (its create action
      coordinates with the create form). Latent quirk noted, not fixed: the
      rename dialog has no cancel/dismiss path (`RenameListForm` has no
      `onCancel` prop; only a successful submit closes it).

### Tier 2 — single async/error state machine

- [x] (`2eac8ae`) `src/features/auth/components/InviteCodeScreen.tsx` — extract
      `useRedeemInviteCode` (`pending`/`error` + the `redeemInviteCode` call).
- [x] (`e8bdb0f`) `src/features/auth/components/SignInScreen.tsx` — extract
      `useGoogleSignIn` (`retryMessage` + the try/catch around
      `signInWithGoogle`).

### Tier 3 — trivial local form state (lower priority, extract for consistency)

- [x] (`cef1dcc`) `src/features/items/components/AddItemForm.tsx` — `useAddItemForm`
      (text state + trim/clear/refocus-on-empty submit gate).
- [x] (`1d810f5`) `src/features/lists/components/CreateListForm.tsx` — fold the local
      `name` field handling into the `useCreateListForm` hook from Tier 1 if
      that hook is designed to own form field state too; otherwise a small
      `useListNameField`-style hook. Decide when Tier 1's ListsScreen item is
      done, to avoid two competing homes for the same state.
- [x] (`b0f97e1`) `src/features/lists/components/RenameListForm.tsx` — same as above,
      align with `useRenameListForm`.
      *Outcome for both:* the field state stays out of the Tier 1
      `useCreateListForm`/`useRenameListForm` hooks (hoisting it would need
      new props and would change reset-on-remount semantics); both form
      components call a shared `useListNameField` (optional `initialName`),
      which is the single home for the name field.
- [x] (`295556b`) `src/features/auth/components/InviteCodeForm.tsx` — extract
      `useInviteCodeField` (local `code` state) if still worth it in
      isolation; low value, skip if the review agent agrees it's not worth
      the indirection.
      *Outcome:* extracted — the review agent's verdict was to keep it for
      consistency once every other form used a hook; kept per-feature
      (mirrors `useListNameField`) rather than a cross-feature generic.

### Known flaky test (pre-existing, unrelated to this refactor)

`ShoppingListScreen.test.tsx › scrolls the just-added item into view once it
arrives in the snapshot` fails intermittently when the machine is under heavy
load (reproduced by running two full suites concurrently). Verified to fail
identically on pre-refactor `becb96f`, so it is environmental jsdom/userEvent
timing, not a regression from the hook extraction.

### Already fine — no action needed

`ListSwitcherOverlay.tsx`, `ListHeader.tsx`, `ListSwitcherItem.tsx`,
`DeleteListConfirmDialog.tsx`, `ClearDoneButton.tsx`, `EmptyListsState.tsx`,
`ListContentPlaceholder.tsx`, `LoadingScreen.tsx` — no `useState`/`useEffect`/
async in any of these as of this spec's writing. Re-check before skipping in
case they've changed since.
