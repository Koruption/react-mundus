import { EntityComponent } from './components'
import {
  BehaviorManager,
  ComponentManager,
  Entity,
  EntityBehavior
} from './entities'
import { ScheduleChangeRequest, SubscriberFn } from './types'
import { World } from './world'

export interface IndexRecord {
  index?: number
  setIndex(newIndex: number): void
}

export interface IEntityComponent<T = any> extends IndexRecord {
  entity: Entity<T>
  readonly worldName: string
  reset(): void
  behaviors: BehaviorManager<T>
  components: ComponentManager<T>
  name: string
  parent?: number
  setParent(eid: number): void
  detach(): void
}

export class EventEmitter<T> {
  subscribers: SubscriberFn<T>[]
  constructor () {
    this.subscribers = []
  }
  emit (data?: T) {
    for (const subscriber of this.subscribers) {
      subscriber({ data: data, timestamp: new Date() })
    }
  }
  subscribe (fn: SubscriberFn<T>) {
    this.subscribers.push(fn)
    return this.subscribers.length
  }
  removeListener (index: number) {
    this.subscribers.splice(index, 1)
  }
  removeAllListeners () {
    this.subscribers = []
  }
}

export interface IEntityComponentEvents<T> {
  onDetached: EventEmitter<T>
  onAttached: EventEmitter<T>
  onChanged: EventEmitter<{ changes: { [K in keyof T]: T[K] } }>
}

export interface IWorldEvents {
  onEntityCreated: EventEmitter<Entity>
  onEntityDestroyed: EventEmitter<number>
  onScheduleChange: EventEmitter<ScheduleChangeRequest>
}
