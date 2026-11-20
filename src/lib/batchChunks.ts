// Firestore batched writes are capped at 500 operations; chunk to a safe
// margin below that so a batch that also needs one extra write (deleteList
// deletes the parent list doc in its final chunk) never risks exceeding the
// limit.
export const MAX_BATCH_WRITES = 450

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}
