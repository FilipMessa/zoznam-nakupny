import { useEffect, useState } from 'react'
import { subscribeLists } from './listApi'
import type { ShoppingList } from './types'

export interface UseListsResult {
  lists: ShoppingList[]
  listsLoading: boolean
}

export function useLists(): UseListsResult {
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [listsLoading, setListsLoading] = useState(true)

  useEffect(() => {
    return subscribeLists((nextLists) => {
      setLists(nextLists)
      setListsLoading(false)
    })
  }, [])

  return { lists, listsLoading }
}
