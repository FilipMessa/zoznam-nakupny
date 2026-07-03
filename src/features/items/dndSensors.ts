import {
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type SensorDescriptor,
  type SensorOptions,
} from '@dnd-kit/core'

// Shared sensor tuning for every DndContext in the shopping-list feature
// (single-list reorder in ActiveItemsList, cross-list drag in the "All
// Lists" screen) so the two can never drift apart. The touch dead zone
// (tolerance: 8) matches useSwipeActions.ts's own 8px dead zone, which is
// how it disambiguates a horizontal swipe-to-reveal gesture from a
// vertical/long-press drag on the same row element -- keep them in sync if
// either ever changes.
export function useShoppingListDndSensors(): SensorDescriptor<SensorOptions>[] {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 8,
      },
    }),
  )
}
