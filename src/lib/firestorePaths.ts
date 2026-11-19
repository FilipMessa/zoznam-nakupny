import { FAMILY_ID } from '@/constants/family'

// Single source of truth for Firestore collection paths (see the data model
// in CLAUDE.md). Only *Api.ts modules should build refs from these.

export function invitesCollectionPath(): string {
  return 'invites'
}

export function membersCollectionPath(): string {
  return `families/${FAMILY_ID}/members`
}

export function listsCollectionPath(): string {
  return `families/${FAMILY_ID}/lists`
}

export function itemsCollectionPath(listId: string): string {
  return `${listsCollectionPath()}/${listId}/items`
}
