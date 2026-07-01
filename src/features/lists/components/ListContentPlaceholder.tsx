export interface ListContentPlaceholderProps {
  listName: string
}

export function ListContentPlaceholder({
  listName,
}: ListContentPlaceholderProps) {
  return <p>Items for {listName} coming soon.</p>
}
