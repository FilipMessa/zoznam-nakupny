import { test, expect } from '@playwright/test'
import { deleteApp, type App } from 'firebase-admin/app'
import {
  getAdminApp,
  seedSignedInMemberWithList,
  signInAsMember,
} from './fixtures'

// ---------------------------------------------------------------------------
// Phase 7 mobile-UI-polish smoke test (mobile-chromium / Pixel 7 project).
//
// This is the first e2e test that needs a *signed-in member* state rather
// than the unauthenticated shell that e2e/smoke.spec.ts checks. There is no
// way to drive the real Google sign-in popup from Playwright, so instead we:
//
//   1. Seed a member + a list directly in the Auth/Firestore emulators via
//      the firebase-admin SDK (mirroring the admin-side fixture seeding in
//      src/test/auth.integration.test.ts / lists.integration.test.ts, which
//      use `withSecurityRulesDisabled`; firebase-admin is the equivalent
//      "always bypasses rules" path when driving the emulator from Node).
//   2. Mint a custom token for that user with admin.auth().createCustomToken.
//   3. Exchange it for a real signed-in session *in the browser* by calling
//      the Firebase Auth JS SDK's signInWithCustomToken(auth, token) against
//      the already-initialized `auth` instance the app itself uses.
//
// Step 3 requires the app to expose a small, emulator-only test hook, since
// there is no other way to reach the app's live `auth` object from outside
// the page. This test assumes that hook exists as:
//
//   window.__e2eSignIn(customToken: string): Promise<void>
//
// FLAGGED APP-CODE REQUIREMENT (for the Implement stage):
//   Add to src/lib/firebase.ts (or a small new src/test/e2eAuthHook.ts
//   imported from main.tsx), guarded by the *same* flag that already gates
//   emulator usage so it can never leak into a production build:
//
//     if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
//       connectFirestoreEmulator(db, 'localhost', 8080)
//       connectAuthEmulator(auth, 'http://localhost:9099')
//       window.__e2eSignIn = (token: string) =>
//         signInWithCustomToken(auth, token).then(() => undefined)
//     }
//
//   (plus a `declare global { interface Window { __e2eSignIn?: ... } }`
//   somewhere picked up by the app's tsconfig). Without this hook, the
//   `signInAsMember` helper has no way to authenticate the page and every
//   test in this file will fail at `page.evaluate(() => window.__e2eSignIn...)`.
//
// The seeding/sign-in helpers themselves live in ./fixtures.ts, shared with
// other e2e specs that also need a signed-in member state.
// ---------------------------------------------------------------------------

let adminApp: App

test.beforeAll(() => {
  adminApp = getAdminApp('mobile-smoke-admin')
})

test.afterAll(async () => {
  await deleteApp(adminApp)
})

test.describe('mobile shopping list flow (Pixel 7)', () => {
  test('add an item, mark it done, and use the list switcher bottom sheet', async ({
    page,
  }, testInfo) => {
    // This spec is specifically about mobile touch-target/bottom-sheet
    // behavior, so it only needs to run under the Pixel 7 project; running it
    // under `chromium` too would be redundant with the desktop smoke test.
    // (A describe-level `test.skip(callback, description)` can't be used here
    // -- that callback form is only evaluated with a real `testInfo` when
    // invoked from inside a running test, not at describe-body collection
    // time, so `testInfo` would be undefined and the call would throw.)
    test.skip(
      testInfo.project.name !== 'mobile-chromium',
      'mobile-only smoke test',
    )

    const fixture = await seedSignedInMemberWithList(adminApp)
    await signInAsMember(page, fixture.customToken, fixture.listId)

    await expect(page.getByText(fixture.listName)).toBeVisible()

    // --- Add an item via the sticky bottom add-bar -------------------------
    const addInput = page.getByRole('textbox').first()
    await expect(addInput).toBeVisible()
    await addInput.click()
    await addInput.fill('mlieko')
    const addButton = page.getByRole('button', { name: /pridať/i })
    await expect(addButton).toBeVisible()
    await addButton.click()

    await expect(page.getByText('mlieko')).toBeVisible()

    // --- Check it off and confirm it moves to "Kúpené" ----------------------
    const activeSection = page.getByRole('heading', { name: /na kúpu/i })
    await expect(activeSection).toBeVisible()
    const doneSection = page.getByRole('heading', { name: /kúpené/i })
    await expect(doneSection).toBeVisible()

    // The app's active-item checkbox is a controlled input that's always
    // unchecked while the item is active (an item only appears in "Na kúpu"
    // when it isn't done yet) -- checking it moves the item straight into
    // "Kúpené" rather than leaving a checked box behind. Playwright's
    // `.check()` polls for the box to end up `checked` after the click,
    // which never happens here by design, so a plain `.click()` (verified
    // below by the item showing up under the "Kúpené" section) is the
    // correct action rather than `.check()`.
    const itemCheckbox = page.getByRole('checkbox').first()
    await expect(itemCheckbox).toBeVisible()
    // The native input is visually hidden behind Checkbox.Control, which
    // paints on top of it at the same position -- a real tap lands on the
    // control and is forwarded to the input by the wrapping <label>, so
    // force the click rather than waiting for the input itself to be
    // hit-testable.
    await itemCheckbox.click({ force: true })

    await expect(
      page.locator('section', { has: doneSection }).getByText('mlieko'),
    ).toBeVisible()

    await doneSection.getByRole('button').click()
    await addInput.fill('ml')
    await page.getByRole('button', { name: 'mlieko', exact: true }).click()
    await expect(addInput).toBeFocused()
    await expect(addInput).toHaveValue('')
    await expect(page.getByText('mlieko', { exact: true })).toBeVisible()

    // --- Open the list switcher and confirm it renders as a bottom sheet ---
    const switcherTrigger = page.getByRole('button', {
      name: /prepnúť zoznam/i,
    })
    await expect(switcherTrigger).toBeVisible()
    await switcherTrigger.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('aria-modal', 'true')

    // --- Close it via the backdrop ------------------------------------------
    const backdrop = page.getByTestId('list-switcher-backdrop')
    await expect(backdrop).toBeVisible()
    // The backdrop div is purely decorative (dismissal is driven by an
    // outside-pointerdown listener on the document, not a click on this
    // element specifically), so it never itself receives pointer events --
    // force the click past that check.
    await backdrop.click({ position: { x: 2, y: 2 }, force: true })
    await expect(dialog).toBeHidden()
  })
})
