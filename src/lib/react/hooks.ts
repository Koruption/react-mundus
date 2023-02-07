import { EntityBehavior } from '../entities'
import { ComponentProps } from '../types'
import { Universe } from '../world'

export type UpdateHandler = (dt?: number) => void | Promise<void>
export type StartHandler = () => void | Promise<void>
export type DetachHandler = () => void

/**
 * If a world with the given name exists, return it, otherwise create it.
 * @param {string} [name] - The name of the world to get. If not provided, the active world is
 * returned.
 * @returns The active world or a new world.
 */
export function useWorld<T = any> (name?: string) {
  console.log('called useWorld()')
  const instance = Universe.instance
  if (!name) {
    return instance.active!
  }
  if (instance.exists(name)) return instance.get<T>(name)!
  console.log('Creating world...')
  return instance.create<T>(name)
}

export function useCreateEntity<T = any> (worldName?: string) {
  console.log('called useCreateEntity()')
  const _worldName = worldName
    ? Universe.instance.get(worldName)!.name
    : Universe.instance.active!.name
  return Universe.instance.get<T>(_worldName)!.Store.create().build()
}

export function useEntity<T> (eid: number, worldName?: string) {
  console.log('called useEntity()')
  const world = worldName
    ? Universe.instance.get(worldName)
    : Universe.instance.active
  return world?.Store.getEntity(eid)
}

export function useEntityBuilder<T = any> (worldName?: string) {
  console.log('called useEntityBuilder()')
  const _worldName = worldName
    ? Universe.instance.get(worldName)!.name
    : Universe.instance.active!.name
  return Universe.instance.get<T>(_worldName)!.Store.create()
}

export function useCreateBehavior<T = any> (name: string, worldName?: string) {
  console.log('called useCreateBehavior()')
  let update: UpdateHandler | undefined = undefined
  let start: StartHandler | undefined = undefined
  let detach: DetachHandler | undefined = undefined
  const _worldName = worldName
    ? Universe.instance.get(worldName)!.name
    : Universe.instance.active!.name

  const onUpdate = (handler: UpdateHandler) => {
    update = handler
  }

  const onStart = (handler: StartHandler) => {
    start = handler
  }

  const onDetached = (handler: DetachHandler) => {
    detach = handler
  }

  const attach = (eid: number) => {
    console.log('called attachBehavior()')
    const entity = Universe.instance.get(_worldName)!.Store.getEntity(eid)
    const behavior = new EntityBehavior(
      _worldName,
      eid,
      0, // this gets overridden by the store
      name
    )
    if (update) {
      behavior.update = update
    }
    if (start) {
      behavior.onStart = start
    }
    if (detach) {
      behavior.onDetached = detach
    }
    entity.behaviors.addBehavior(behavior)

    return behavior
  }

  return {
    onUpdate: onUpdate,
    onStart: onStart,
    onDetached: onDetached,
    attach: attach
  }
}

export function useCreateComponent<T = any> (
  props: ComponentProps<T>,
  worldName?: string
) {
  const world = worldName
    ? Universe.instance.get(worldName)!
    : Universe.instance.active!
  const attach = (eid: number) => {
    console.log('called attachComponent()')
    return world.Store.getEntity(eid)!.components.addComponent(props)
  }
  return { attach: attach }
}
