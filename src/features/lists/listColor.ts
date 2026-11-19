export const LIST_COLOR_PALETTE = [
  'blue',
  'plum',
  'teal',
  'amber',
  'rose',
  'sage',
  'sky',
  'mauve',
] as const

export interface ListColor {
  solid: string
  subtle: string
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export function listColorFor(listId: string): ListColor {
  const hue = LIST_COLOR_PALETTE[hashString(listId) % LIST_COLOR_PALETTE.length]
  return { solid: `${hue}.solid`, subtle: `${hue}.subtle` }
}
