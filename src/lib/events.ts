import { ScheduleChangeRequest } from './types'
import { EventEmitter, IWorldEvents, IEntityComponentEvents } from './classes'
import { EntityComponent } from './components'
import { Entity, EntityBehavior } from './entities'

export class WorldEvents implements IWorldEvents {
  readonly onEntityCreated: EventEmitter<Entity>
  readonly onScheduleChange: EventEmitter<ScheduleChangeRequest>
  readonly onEntityDestroyed: EventEmitter<number>
  constructor () {
    this.onEntityCreated = new EventEmitter()
    this.onEntityDestroyed = new EventEmitter()
    this.onScheduleChange = new EventEmitter()
  }
}

export class EntityBehaviorEvents
  implements IEntityComponentEvents<EntityBehavior>
{
  readonly onDetached: EventEmitter<EntityBehavior<any>>
  readonly onAttached: EventEmitter<EntityBehavior<any>>
  readonly onChanged: EventEmitter<{
    changes: { [K in keyof EntityBehavior]: EntityBehavior[K] }
  }>
  constructor () {
    this.onAttached = new EventEmitter()
    this.onChanged = new EventEmitter()
    this.onDetached = new EventEmitter()
  }
}

export class EntityComponentEvents<T = any>
  implements IEntityComponentEvents<EntityComponent<T>>
{
  readonly onDetached: EventEmitter<EntityComponent<T>>
  readonly onAttached: EventEmitter<EntityComponent<T>>
  readonly onChanged: EventEmitter<{
    changes: { [K in keyof EntityComponent<T>]: EntityComponent<T>[K] }
  }>
  constructor () {
    this.onAttached = new EventEmitter()
    this.onChanged = new EventEmitter()
    this.onDetached = new EventEmitter()
  }
}
