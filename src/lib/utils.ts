import { BaseComponent } from './components'
import { Entity, EntityBehavior } from './entities'
import { EntityBehaviorStore } from './store'
import { MappedComponent } from './types'
import { World } from './world'

export class EntityIdManager<T> {
  private id: T
  public get count() {
    return this.id
  }
  constructor(defaultId: T, createId: (entity: T) => T) {
    this.id = defaultId
    this.createId = createId
  }
  private createId(id: T): T {
    throw new Error('Method not implemented.')
  }
  generateId() {
    this.id = this.createId(this.id)
    return this.id
  }
}

export class PriorityQueue<T> {
  items: { priority: number; data: T }[] = []
  private ptr: number = 0
  comparator: (a: any, b: any) => boolean

  constructor(comparator?: (a: any, b: any) => boolean) {
    this.comparator = comparator ? comparator : (a: number, b: number) => a < b
  }

  /**
   * If the item exists in the queue, delete it and re-add it with the new priority
   * @param comparer - (item: T) => boolean
   * @param {T} update - The new item to be added to the queue.
   * @param {number} priority - number - The priority of the item.
   */
  requeue(comparer: (item: T) => boolean, update: T, priority: number) {
    this.delete(comparer)
    return this.enqueue(update, priority)
  }

  enqueue(item: T, priority: number) {
    let hit = false
    for (let i = 0; i < this.items.length; i++) {
      if (this.comparator(priority, this.items[i].priority)) {
        hit = true
        this.items.splice(i, 0, { priority: priority, data: item })
        return i
        break
      }
    }
    if (!hit) this.items.push({ data: item, priority: priority })
    return this.items.length - 1
  }
  rmdequeue() {
    return this.items.shift()
  }
  get size() {
    return this.items.length
  }
  dequeue() {
    if (!this.items.length) return undefined
    const item = this.items[this.ptr]
    this.ptr += 1
    if (this.ptr >= this.items.length - 1) this.clearPtr()
    return item
  }
  rmdeque() {
    if (!this.items.length) return undefined
    const item = this.items.splice(0, 1).pop()
    this.ptr += 1
    if (this.ptr >= this.items.length - 1) this.clearPtr()
    return item
  }
  clearPtr() {
    this.ptr = 0
  }
  front() {
    return this.items.length ? this.items[0] : undefined
  }
  tail() {
    return this.items.length ? this.items[this.items.length - 1] : undefined
  }
  deleteAtIndex(index: number) {
    this.items.splice(index, 1)
  }
  delete(comparer: (item: T) => boolean) {
    let indx = 0
    for (let item of this.items) {
      if (comparer(item.data)) {
        const removedItem = this.items.splice(indx, 1).pop()!.data
        return removedItem
      }
      indx += 1
    }
  }
}

/**
 * Attaches a readonly index to the component.
 * @param index
 * @param component
 */
export const setComponentIndex = (component: BaseComponent, index: number) => {
  if (index < 0) throw new Error(`Component indices cannot be negative`)
  Object.assign(component, Object.freeze({ index: index }))
}

export const clearComponent = (component: BaseComponent) => {
  setComponentIndex(component, -1)
  setComponentParent(null, component)
}

export const Component = <T>(name: string, props: T) => {
  const component = new BaseComponent<T>(name, props)
  return component as MappedComponent<T>
}

/**
 * Attaches a readonly entity id (eid) to the component,
 * assigning the eid to the *parent* property of the component.
 * @param eid the entity id of entity which will be this component's parent
 * @param component the component which will be this entity's child
 */
export const setComponentParent = (
  eid: number | null = null,
  component: BaseComponent
) => {
  Object.assign(component, Object.freeze({ eid: eid }))
}

export interface IActorBuilder<T> {
  build(): Entity<T> | Entity<T>[]
}

export interface IBuilderSetup<T> {
  _withComponents: Partial<T>
  _withBehaviors: { new (...args: any): EntityBehavior<any> }[]
  store: EntityBehaviorStore<T>
  withComponents<K extends keyof T>(components: {
    [key in K]: T[K]
  }): any
  withBehaviors(
    ...behaviors: { new (...args: any): EntityBehavior<any> }[]
  ): any
}

export class BuilderSetup<T> implements IBuilderSetup<T> {
  readonly _withComponents: Partial<T> = {}
  readonly _withBehaviors: { new (...args: any): EntityBehavior<any> }[] = []

  constructor(readonly store: EntityBehaviorStore<T>) {}

  withComponents<K extends keyof T>(components: {
    [key in K]: T[K]
  }) {
    for (const compKey in components) {
      this._withComponents[compKey] = components[compKey] as any // TODO: Fix this type cast
    }
    return this
  }

  withBehaviors(...behaviors: { new (...args: any): EntityBehavior<any> }[]) {
    for (const behavior of behaviors) {
      this._withBehaviors.push(behavior)
    }
    return this
  }
}

/* It's a builder for creating entities */
export class ActorBuilder<T>
  extends BuilderSetup<T>
  implements IActorBuilder<T>
{
  build(): Entity<T> {
    return this.store._create(this._withBehaviors, this._withComponents)
  }
}

export class BatchedActorBuilder<T>
  extends BuilderSetup<T>
  implements IActorBuilder<T>
{
  constructor(store: EntityBehaviorStore<T>, private amount: number) {
    super(store)
  }
  build() {
    const entities: Entity<T>[] = []
    for (let i = 0; i < this.amount; i++) {
      entities.push(
        this.store._create(this._withBehaviors, this._withComponents)
      )
    }
    return entities
  }
}

/**
 * It returns the name of a class or a string.
 * @param {{ new (...args: any[]): T } | string} behavior - { new (...args: any[]): T } | string
 * @returns The name of the behavior.
 */
export function getBehaviorName<T extends EntityBehavior>(
  behavior: { new (...args: any[]): T } | string
) {
  return behavior instanceof String || typeof behavior === 'string'
    ? behavior
    : behavior.name
}

/**
 * It takes a value and an object reference, and returns the value as a key of the object reference
 * @param {any} val - any - the value to be converted to a key of the object
 * @param {T} objectRef - T
 * @returns The type of the key of the objectRef
 */
export function asObjectIndex<T>(val: any, objectRef: T) {
  return val as keyof typeof objectRef
}

const BehavioralComponentOmitLiterals = ['_index', '_parent', '_name', 'name']

/**
 * It removes all the properties from a component that are not allowed to be passed to behavioral
 * component
 * @param {object} component - object
 */
export function stripProps<T>(component: T) {
  for (const key of BehavioralComponentOmitLiterals) {
    if ((component as object).hasOwnProperty(key))
      delete component[asObjectIndex(key, component)]
  }
}
