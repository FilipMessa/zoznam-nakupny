import { useEffect, useState } from 'react'
import { subscribeItems } from './itemApi'
import type { ShoppingItem } from './types'

export interface UseItemsResult {
  items: ShoppingItem[]
  itemsLoading: boolean
}

export function useItems(listId: string): UseItemsResult {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(true)

  useEffect(() => {
    return subscribeItems(listId, (nextItems) => {
      setItems(nextItems)
      setItemsLoading(false)
    })
  }, [listId])

  return { items, itemsLoading }
}
