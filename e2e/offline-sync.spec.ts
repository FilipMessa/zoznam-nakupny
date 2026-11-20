import { test, expect } from '@playwright/test'
import { getAuth } from 'firebase-admin/auth'
import { deleteApp, type App } from 'firebase-admin/app'
import {
  getAdminApp,
  seedSignedInMemberWithList,
  signInAsMember,
} from './fixtures'

// Phase 5 of offline support: exercises the whole offline flow against the
// real Firestore/Auth emulators -- go offline, add/check an item (and
// separately, create a whole new list) while offline, confirm the UI
// reflects it immediately with no server round-trip, then go back online
// and confirm it actually reaches the server (not just held in the tab's
// memory) by reloading the page.

let adminApp: App

test.beforeAll(() => {
  adminApp = getAdminApp('offline-sync-admin')
})

test.afterAll(async () => {
  await deleteApp(adminApp)
})

test.describe('offline sync', () => {
  test('adding and checking off an item while offline syncs once reconnected', async ({
    page,
    context,
  }) => {
    const fixture = await seedSignedInMemberWithList(adminApp)
    await getAuth(adminApp).createUser({
      uid: fixture.uid,
      displayName: 'Šimon',
    })
    await signInAsMember(page, fixture.customToken, fixture.listId)

    await expect(page.getByText(fixture.listName)).toBeVisible()
    await expect(page.getByTitle('Živé spojenie')).toBeVisible()

    await context.setOffline(true)
    await expect(page.getByTitle('Offline')).toBeVisible()

    const addInput = page.getByRole('textbox').first()
    await addInput.click()
    await addInput.fill('mlieko')
    await page.getByRole('button', { name: /pridať/i }).click()

    await expect(page.getByText('mlieko')).toBeVisible()
    const avatar = page.getByRole('img', {
      name: 'Autor položky: Šimon',
      exact: true,
    })
    await expect(avatar).toHaveText('Š')
    await expect(page.getByTitle('Čaká na odoslanie')).toBeVisible()

    const itemCheckbox = page.getByRole('checkbox').first()
    // The native checkbox input is visually hidden behind Checkbox.Control
    // (the styled box the user actually sees), which paints on top of it at
    // the same position -- Playwright's actionability check sees the
    // control "intercepting" the click. A real tap lands on the control and
    // is forwarded to the input by the wrapping <label>, so force the click
    // rather than waiting for the input itself to be hit-testable.
    await itemCheckbox.click({ force: true })

    const doneSection = page.getByRole('heading', { name: /hotové/i })
    await expect(
      page.locator('section', { has: doneSection }).getByText('mlieko'),
    ).toBeVisible()

    await context.setOffline(false)
    await expect(page.getByTitle('Živé spojenie')).toBeVisible()
    await expect(page.getByTitle('Čaká na odoslanie')).not.toBeVisible()

    // Prove it actually reached the server, not just this tab's memory.
    await page.reload()
    await expect(avatar).toHaveText('Š')
    await expect(
      page.locator('section', { has: doneSection }).getByText('mlieko'),
    ).toBeVisible()
  })

  test('creating a new list while offline is usable immediately and persists after reconnect', async ({
    page,
    context,
  }) => {
    const fixture = await seedSignedInMemberWithList(adminApp)
    await signInAsMember(page, fixture.customToken, fixture.listId)

    await expect(page.getByText(fixture.listName)).toBeVisible()

    await context.setOffline(true)

    await page.getByRole('button', { name: /prepnúť zoznam/i }).click()
    await page.getByRole('button', { name: /vytvoriť nový zoznam/i }).click()

    const nameInput = page.getByLabel('Názov zoznamu')
    await nameInput.fill('Nový offline zoznam')
    await page.getByRole('button', { name: /vytvoriť/i }).click()

    await expect(page.getByText('Nový offline zoznam')).toBeVisible()
    await expect(page.getByTitle('Zoznam čaká na odoslanie')).toBeVisible()

    await context.setOffline(false)
    await expect(page.getByTitle('Zoznam čaká na odoslanie')).not.toBeVisible()

    await page.reload()
    await expect(page.getByText('Nový offline zoznam')).toBeVisible()
  })
})
