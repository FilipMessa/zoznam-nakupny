// Relative import on purpose: this module is pure strings with no runtime
// Firebase imports, so it is also used by scripts/seed.ts and the e2e
// fixtures, which run under tsx/Playwright without the `@/` alias.
import { FAMILY_ID } from '../constants/family'

// Single source of truth for Firestore collection and document paths (see
// the data model in CLAUDE.md). Client code builds refs from these inside
// *Api.ts modules; scripts/seed.ts and e2e/fixtures.ts use them with
// firebase-admin.

export function familyDocPath(): string {
  return `families/${FAMILY_ID}`
}

export function invitesCollectionPath(): string {
  return 'invites'
}

export function inviteDocPath(code: string): string {
  return `${invitesCollectionPath()}/${code}`
}

export function membersCollectionPath(): string {
  return `${familyDocPath()}/members`
}

export function memberDocPath(uid: string): string {
  return `${membersCollectionPath()}/${uid}`
}

export function listsCollectionPath(): string {
  return `${familyDocPath()}/lists`
}

export function listDocPath(listId: string): string {
  return `${listsCollectionPath()}/${listId}`
}

export function itemsCollectionPath(listId: string): string {
  return `${listDocPath(listId)}/items`
}

export function itemDocPath(listId: string, itemId: string): string {
  return `${itemsCollectionPath(listId)}/${itemId}`
}
