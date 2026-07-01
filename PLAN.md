# Firebase Rodinny Nakupny Zoznam

## Summary

Postavit od nuly mobile-first web appku pre rodinu s viacerymi nakupnymi zoznamami: Google login, invite kod, realtime sync, viacero pomenovanych zoznamov (vytvorenie/premenovanie/zmazanie), rucne presuvanie aktivnych poloziek, odskrtnute polozky dole podla casu dokoncenia. Stack: Vite + React + TypeScript + Firebase Hosting/Auth/Firestore.

Terminologia a rozhodnutia z grilling session: pozri `CONTEXT.md` (glosar) a `docs/adr/` (architektonicke rozhodnutia).

## Key decisions from grilling session

- **Single-tenant**: jeden Firebase projekt = jedna Family navzdy. `familyId` je fixna konstanta v kode, nie runtime lookup.
- **Firestore nesting zostava**: `families/{familyId}/...` aj ked existuje len jedna family (viz CONTEXT.md).
- **Invite code je staticky**, seedovany raz manualne — pripravit seed skript na jeho generovanie (Phase 2).
- **Ziadne role**: vsetci Members su rovnaki, ziadny owner/admin. Odobratie membera je manualna Firestore console operacia.
- **Viacero Lists per Family**: kazdy Member vidi a moze upravovat kazdy List. Ziadny default list — po pripojeni prazdny stav s "vytvorit list" akciou.
- **Full CRUD na Lists** (create/rename/delete), vratane hard delete s cascade zmazanim vsetkych Items (ADR 0001).
- **List switching je overlay, nie samostatna route** — zachovava "jedna obrazovka" mobile UX (ziadny landing/index page).
- **`activeOrder` je fractional index** (float), nie dense integer (ADR 0002) — kazdy reorder zapisuje len jeden dokument.
- **Done items sa nikdy auto-nepurgnu** — len manualne zmazanie (single item alebo "clear all done" v UI).

## Firestore Schema

- `families/{familyId}` (familyId je fixna konstanta)
- `families/{familyId}/members/{uid}`
- `families/{familyId}/lists/{listId}`
  - `name: string`
  - `createdAt`, `createdBy`
- `families/{familyId}/lists/{listId}/items/{itemId}`
- `invites/{inviteCode}`

## Public Interfaces / Types

- `ShoppingList`
  - `id`
  - `name`
  - `createdAt`
  - `createdBy`
- `ShoppingItem`
  - `id`
  - `text`
  - `status: "active" | "done"`
  - `activeOrder: number | null` (fractional index, see ADR 0002)
  - `completedAt: Timestamp | null`
  - `completedBy: string | null`
  - `createdAt`
  - `createdBy`
  - `updatedAt`
- App-level public behavior:
  - signed-out users see Google login
  - signed-in non-members see invite form
  - members with no lists see an empty state prompting list creation
  - members see the realtime item list for the currently selected List, with a header control to switch/create/rename/delete Lists
- Firestore security contract:
  - non-auth users cannot read/write family data
  - auth users without `members/{uid}` cannot read/write any family data (lists or items)
  - members can create/update/delete Lists and Items within the Family

## Phase Workflow (applies to every phase below)

Each phase is executed as a pipeline of subagent invocations, run in this order. Do not skip steps or collapse them into the main thread — each stage is a distinct subagent call so the next stage starts with fresh, unbiased context.

1. **Plan subagent** — given the phase's goal (from this document) and current repo state, produce a concrete task breakdown: files to touch, functions/components to add, order of implementation, and open questions to flag back to the user before proceeding.
2. **Analyze tests subagent** — given the phase's plan, derive the concrete unit tests and e2e tests for this phase from the "Unit Tests" / "E2E Tests" sections below (or write new ones if the phase introduces behavior not yet listed). Output must be actual test names/descriptions, not just categories.
3. **Implement subagent** — given the plan and the test list, implement the phase using the TDD vertical-slice loop (RED/GREEN/refactor per behavior, not "write all tests first"). Runs focused tests as it goes.
4. **Test subagent** — runs the full relevant test suite (unit + e2e) for the phase end-to-end, independent of the implement subagent, and reports pass/fail with no fixes applied — just verification.
5. **Review subagent** — reviews the diff for the phase against this PLAN.md and CONTEXT.md for correctness, scope creep, and consistency with resolved decisions/ADRs. Reports findings; does not fix them.
6. **Fix loop** — if the test or review subagent finds issues, route back to the Implement subagent with the specific findings, then re-run Test and Review. Repeat until clean.
7. **Commit subagent** — once tests pass and review is clean, stage and commit the phase's changes with a message describing what the phase delivered.

Only proceed to the next phase after its commit subagent step completes.

## Phases

1. **Bootstrap**
   - Inicializovat repo ako Vite React TS app (a `git init`, kedze repo este nie je git repository).
   - Pridat Firebase SDK, Vitest, Testing Library, Playwright, `@dnd-kit`, `lucide-react`.
   - Nastavit `npm` skripty: `dev`, `build`, `test`, `test:watch`, `test:e2e`, `lint`.

2. **Firebase Foundation**
   - Pridat Firebase config cez `.env.example`.
   - Nastavit `firebase.json`, Firestore rules a lokalny emulator config.
   - Zapnut Google Auth a Firestore struktura podla sekcie "Firestore Schema" vyssie.
   - Napisat seed skript na generovanie static invite code (`invites/{inviteCode}` doc).

3. **Auth + Invite**
   - Google sign-in.
   - Ak pouzivatel nie je clen rodiny, zobrazit invite-code obrazovku.
   - Valid invite code vytvori membership pre aktualneho usera.
   - Firestore rules povolia citanie/zapis lists/items iba clenom rodiny.

4. **List Management**
   - Empty state pre membera bez ziadneho listu, s akciou "vytvorit list".
   - Vytvorenie, premenovanie, zmazanie listu (hard delete, cascade zmazanie vsetkych items — ADR 0001).
   - Prepinanie medzi listami cez header overlay/drawer (nie samostatna route — zachovat "jedna obrazovka").
   - Posledny zobrazeny list sa pamata lokalne (napr. localStorage), aby opakovana navsteva preskocila vyber.

5. **Shopping List Core**
   - Add item (do aktualne vybraneho listu).
   - Realtime subscribe na items daneho listu.
   - Aktivne polozky: `status = active`, sort podla `activeOrder`.
   - Done polozky: `status = done`, sort podla `completedAt`.
   - Check item: nastavi `done`, `completedAt`, `completedBy`.
   - Uncheck item: vrati polozku do active na koniec (novy fractional index vacsi ako aktualne maximum).
   - Delete done item (jednotlivo) a "clear all done" akcia.

6. **Manual Ordering**
   - Drag-and-drop iba v active sekcii, v ramci jedneho listu.
   - Po reorder zapisat fractional `activeOrder` iba pre presuvanu polozku (ADR 0002) — ziadny batch update celeho zoznamu.
   - Done sekcia sa nereorderuje rucne; poradie urcuje cas dokoncenia.

7. **Mobile UI Polish**
   - Jedna obrazovka bez landing page; list switching je overlay/drawer, nie route.
   - Sticky add input alebo spodny add panel.
   - Sekcie `Na kupu` a `Hotove`.
   - Velke touch targety, kompaktne ikonove akcie, jasne empty/loading/error stavy (vratane "ziadny list" a "prazdny list" stavov).
   - Overit pouzitelnost v mobile viewportoch.

8. **Deploy**
   - Lokalny emulator smoke test.
   - Production build.
   - Firebase Hosting deploy.
   - Kratky README: Firebase setup, env vars, ako spustit seed skript pre invite code, test commands, deploy command.

## TDD Agent Loop

Use vertical slices, not "write all tests first".

1. RED: write one failing test for the next observable behavior.
2. GREEN: implement only enough to pass.
3. Run focused test.
4. Refactor only while green.
5. Run full relevant suite before moving to next slice.
6. Repeat.

Suggested slice order:

1. Item ordering pure logic (fractional index math).
2. Done transition pure logic.
3. List CRUD pure logic (create/rename/delete + cascade).
4. Auth/invite state rendering.
5. Firestore repository contract with emulator.
6. Main list realtime behavior (per selected List).
7. List switching overlay behavior.
8. Drag reorder behavior.
9. E2E happy path.
10. E2E security/permission path.

## Unit Tests

- `sortItems`:
  - active items sort by `activeOrder`
  - done items sort by `completedAt`
  - active items render before done sections
- `completeItemPatch`:
  - checking active item creates correct done patch
  - `completedAt` is set from injected clock, not computed inside assertion
- `restoreItemPatch`:
  - unchecking done item appends it to active list (new max fractional index)
  - clears `completedAt` and `completedBy`
- `reorderActiveItems`:
  - drag result generates a fractional `activeOrder` between the correct neighbors
  - moving to the top/bottom of the list produces a valid boundary index
  - done items are ignored by active reorder
- `listCrud` (pure logic):
  - creating a list requires a non-empty name
  - deleting a list marks all its items for cascade deletion
  - renaming a list does not affect its items
- UI component tests:
  - add item clears input after success
  - empty active list shows useful empty state
  - empty list-of-lists shows "create your first list" state
  - done section can be hidden/expanded if implemented
  - list switcher overlay opens/closes without navigating away from the item screen

## Integration Tests

- Firebase emulator:
  - unauthenticated read/write is denied
  - signed-in non-member read/write (lists or items) is denied
  - valid invite creates membership for current user
  - member can create/rename/delete a list
  - deleting a list deletes all of its items
  - member can add/check/uncheck/delete item within a list
- Repository-level:
  - subscribing to a list's items receives remote changes
  - single-document reorder writes update only the moved item

## E2E Tests

Use Playwright against emulator-backed app.

- **First join flow**
  - user signs in with test auth
  - enters invite code
  - lands on empty "create your first list" state
- **List management flow**
  - create a list, see it appear in the switcher
  - rename a list, see the updated name reflected
  - delete a list, confirm its items are gone and it's removed from the switcher
- **Realtime family flow**
  - browser A adds `mlieko` to a list
  - browser B (same list) sees `mlieko` without refresh
  - browser B checks it done
  - browser A sees it move to done
- **Manual reorder**
  - add `chlieb`, `mlieko`, `vajcia` to a list
  - drag `vajcia` above `chlieb`
  - reload page
  - order persists
- **Done ordering**
  - check items in known order
  - done section shows completion order
- **Restore**
  - uncheck done item
  - item returns to bottom of active list
- **Clear done**
  - check several items
  - use "clear all done"
  - done section is empty
- **Permissions**
  - non-member direct navigation never shows list contents
  - invalid invite code keeps user on invite screen
- **Mobile smoke**
  - run core add/check/reorder/list-switch flow at mobile viewport
  - assert controls are visible and clickable

## Assumptions

- Single Family per Firebase project deployment (single-tenant); a second family requires a separate deployment.
- Quantity/category are not structured fields in v1; users type them into item text.
- Invite code is a long private bearer code seeded manually via a script (Phase 2); no in-app rotation UI in v1.
- Firebase Spark/free tier is acceptable for family usage.
- No owner/admin role; member removal is a manual Firestore console operation.
- Done items are never auto-purged; cleanup is manual (single delete or "clear all done").
- Notion is rejected for this plan because we want custom auth, precise realtime UX, and exact done/reorder/list-management behavior.
