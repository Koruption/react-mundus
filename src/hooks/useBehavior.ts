import { useEffect, useState } from 'react'
import { EntityBehavior } from '../lib/entities'
import { Universe } from '../lib/world'

export default function useBehavior (behaviorName: string) {
  const [_update, setUpdate] = useState<(dt: number) => void | Promise<void>>()
  const [_onStart, setOnStart] = useState<() => void | Promise<void>>()
  const [_onDetached, setOnDetached] = useState<() => void | Promise<void>>()
  useEffect(() => {
    const behavior = new EntityBehavior(
      Universe.instance.active!.name,
      1,
      1,
      behaviorName
    )
    if (_update) {
      behavior.update = _update
    }
    if (_onStart) {
      behavior.onStart = _onStart
    }
    if (_onDetached) {
      behavior.onDetached = _onDetached
    }
  }, [])

  return {
    onUpdate: setUpdate,
    onStart: setOnStart,
    onDetached: setOnDetached
  }
}

export function SomeComponent () {
  const { onUpdate, onStart, onDetached } = useBehavior('MyBehavior')
  onUpdate((dt: number) => {})
  onStart(() => {})
  onDetached(() => {})
}
