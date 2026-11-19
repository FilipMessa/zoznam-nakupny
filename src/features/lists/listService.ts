export type ValidateListNameResult = { ok: true; name: string } | { ok: false }

export function validateListName(name: string): ValidateListNameResult {
  const trimmed = name.trim()
  if (trimmed.length === 0) {
    return { ok: false }
  }
  return { ok: true, name: trimmed }
}
