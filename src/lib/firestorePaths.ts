// Relative import on purpose: this module is pure strings with no runtime
// Firebase imports, so it is also used by scripts/seed.ts and the e2e
// fixtures, which run under tsx/Playwright without the `@/` alias.
import { FAMILY_ID } from '../constants/family'

// Single source of truth for Firestore collection paths (see the data model
// in CLAUDE.md). One style throughout: a constant where the path is fixed, a
// function only where it takes a parent id, and no *DocPath helpers -- a
// document is addressed as its collection path plus an id, e.g.
// `doc(firestore, LISTS_COLLECTION_PATH, listId)` in *Api.ts modules and
// `db.collection(LISTS_COLLECTION_PATH).doc(listId)` with firebase-admin in
// scripts/seed.ts and e2e/fixtures.ts. The family document is the one fixed
// document path.

export const FAMILY_DOC_PATH = `families/${FAMILY_ID}`
export const INVITES_COLLECTION_PATH = 'invites'
export const MEMBERS_COLLECTION_PATH = `${FAMILY_DOC_PATH}/members`
export const LISTS_COLLECTION_PATH = `${FAMILY_DOC_PATH}/lists`

export function itemsCollectionPath(listId: string): string {
  return `${LISTS_COLLECTION_PATH}/${listId}/items`
}
