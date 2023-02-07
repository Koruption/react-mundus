import { useEffect, useMemo, useState } from 'react'
import { Entity, EntityBehavior } from '../lib/entities'
import { Universe } from '../lib/world'

export default function useBehavior (behaviorName: string, entity: Entity) {
  const [_update, setUpdate] = useState<(dt: number) => void | Promise<void>>()
  const [_onStart, setOnStart] = useState<() => void | Promise<void>>()
  const [_onDetached, setOnDetached] = useState<() => void | Promise<void>>()

  const attach = () => {
    const behavior = new EntityBehavior(
      Universe.instance.active!.name,
      entity.eid,
      0, // this gets overridden by the store
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
    entity.behaviors.addBehavior(behavior)
  }

  return {
    onUpdate: setUpdate,
    onStart: setOnStart,
    onDetached: setOnDetached,
    attach: attach
  }
}
