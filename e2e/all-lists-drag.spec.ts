import { test, expect } from '@playwright/test'
import { deleteApp, type App } from 'firebase-admin/app'
import {
  getAdminApp,
  seedSignedInMemberWithTwoLists,
  signInAsMember,
} from './fixtures'

// ---------------------------------------------------------------------------
// Phase 7 e2e coverage for the "All Lists" screen's cross-list drag-and-drop
// (see /Users/fmessa/.claude/plans/navrhni-ako-by-sme-async-wind.md). This is
// the first drag-simulation test in this codebase -- there's no dnd-kit
// helper for Playwright, so the drag is driven via raw page.mouse
// move/down/move/up calls. Runs under the `chromium` (desktop) project only:
// dnd-kit's MouseSensor activates on an 8px pointer move, which is far less
// timing-sensitive to simulate than TouchSensor's 180ms-delay activation the
// `mobile-chromium` project would exercise instead.
//
// Needs the Auth + Firestore emulators running separately (see CLAUDE.md):
//   firebase emulators:exec --only firestore,auth "npm run test:e2e"
// ---------------------------------------------------------------------------

let adminApp: App

test.beforeAll(() => {
  adminApp = getAdminApp('all-lists-drag-admin')
})

test.afterAll(async () => {
  await deleteApp(adminApp)
})

test.describe('All Lists screen — cross-list drag', () => {
  test('dragging an item onto another list moves it there, and the move persists across reload', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium',
      'desktop-only: MouseSensor is far less flaky to drive than TouchSensor',
    )

    const fixture = await seedSignedInMemberWithTwoLists(adminApp)
    await signInAsMember(page, fixture.customToken, fixture.listAId)

    await page.getByRole('button', { name: 'Všetky zoznamy' }).click()

    const listASection = page.locator('section', {
      has: page.getByRole('button', { name: fixture.listAName }),
    })
    const listBSection = page.locator('section', {
      has: page.getByRole('button', { name: fixture.listBName }),
    })

    await expect(listASection.getByText(fixture.itemText)).toBeVisible()
    await expect(listBSection.getByText(fixture.itemText)).not.toBeVisible()

    const sourceRow = page.getByTestId(`active-item-content-${fixture.itemId}`)
    const destHeader = page.getByRole('button', { name: fixture.listBName })

    // Driving dnd-kit with raw synthetic mouse events is inherently
    // timing-sensitive -- a dropped/delayed intermediate move can mean the
    // sensor's activation handler never fires before mouseup, silently
    // losing the whole gesture. Retrying the full down/move/up sequence a
    // few times, each with a short verification window, absorbs that
    // flakiness without masking a genuine functional regression (which
    // would fail every attempt identically).
    let moved = false
    for (let attempt = 0; attempt < 3 && !moved; attempt += 1) {
      // FAMILY_ID is a fixed single-tenant constant (see fixtures.ts), so
      // every List ever seeded against this emulator -- across every e2e
      // spec and every prior run, and in a real long-lived family's data
      // too -- renders as its own accordion section here. Past a
      // viewport's worth of lists, source and destination can't both be
      // on-screen at once, so this scrolls to each in turn (source first,
      // to start the drag; destination only once the "mouse" is already
      // down, mirroring how a real drag-triggered auto-scroll would bring
      // it into view) rather than scrolling to both up front, which could
      // leave whichever was scrolled to first off-screen by the time its
      // boundingBox() is actually used.
      await sourceRow.scrollIntoViewIfNeeded()
      const sourceBox = await sourceRow.boundingBox()
      if (!sourceBox) {
        throw new Error('expected the source row to be visible')
      }
      const sourceCenter = {
        x: sourceBox.x + sourceBox.width / 2,
        y: sourceBox.y + sourceBox.height / 2,
      }

      await page.mouse.move(sourceCenter.x, sourceCenter.y)
      await page.mouse.down()
      // Cross dnd-kit's MouseSensor 8px activation distance before the real
      // move toward the destination, or the drag never starts. The pause
      // afterward gives the sensor's activation handler (and React's
      // resulting isDragging re-render) time to actually run before the
      // next synthetic event arrives.
      await page.mouse.move(sourceCenter.x + 20, sourceCenter.y + 20, {
        steps: 10,
      })
      await page.waitForTimeout(100)

      await destHeader.scrollIntoViewIfNeeded()
      await page.waitForTimeout(100)
      const destBox = await destHeader.boundingBox()
      if (!destBox) {
        throw new Error('expected the destination header to be visible')
      }
      const destCenter = {
        x: destBox.x + destBox.width / 2,
        y: destBox.y + destBox.height / 2,
      }

      await page.mouse.move(destCenter.x, destCenter.y, { steps: 15 })
      await page.waitForTimeout(100)
      await page.mouse.up()

      try {
        await expect(listBSection.getByText(fixture.itemText)).toBeVisible({
          timeout: 3000,
        })
        moved = true
      } catch {
        // Gesture didn't take effect this attempt -- release the mouse
        // (in case it's still "down" from a half-registered drag) and
        // retry from a freshly-measured source position.
        await page.mouse.up()
      }
    }

    expect(moved).toBe(true)
    await expect(listASection.getByText(fixture.itemText)).not.toBeVisible()

    // Reload to confirm the move actually persisted to Firestore, not just
    // an optimistic local UI state.
    await page.reload()
    await page.getByRole('button', { name: 'Všetky zoznamy' }).click()

    const listBSectionAfterReload = page.locator('section', {
      has: page.getByRole('button', { name: fixture.listBName }),
    })
    await expect(
      listBSectionAfterReload.getByText(fixture.itemText),
    ).toBeVisible()
  })
})
