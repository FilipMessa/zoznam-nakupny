import type { MoveItemResult } from './itemService'

type MoveConflictReason = Exclude<MoveItemResult, { ok: true }>['reason']

const MESSAGES: Record<MoveConflictReason, string> = {
  'source-missing': 'Položku medzičasom presunul niekto iný.',
  'dest-list-missing': 'Cieľový zoznam už neexistuje.',
}

export function moveConflictMessage(reason: MoveConflictReason): string {
  return MESSAGES[reason]
}
