import { IEntityComponent } from "./classes";
import { EntityComponent } from "./components";
import { EntityBehaviorEvents } from "./events";
import { EntityBehaviorStore } from "./store";
import { ComponentProps } from "./types";
import { Universe, World } from "./world";

export class ComponentManager<T> {
  constructor(private store: EntityBehaviorStore<T>, private eid: number) {}
  getComponents<K extends keyof T>() {
    return this.store.getComponents(this.eid) as {
      [key in K]: T[K] & EntityComponent<T[K]>;
    }[];
  }
  getComponent<K extends keyof T = any>(
    component: K
  ): EntityComponent<T[K]> & T[K] {
    return this.store.getComponent(
      this.eid,
      component as string
    ) as EntityComponent<T[K]> & T[K];
  }
  hasComponent(component: string) {
    return this.store.hasComponent(this.eid, component);
  }

  hasAllComponents(components: string[]) {
    return this.store.hasAllComponents(this.eid, components);
  }
  hasSomeComponents(components: string[]) {
    return this.store.hasSomeComponents(this.eid, components);
  }

  // TODO: Finish this implementation
  removeComponent(component: string) {
    if (!this.hasComponent(component)) return;
    const removedComponent = this.getComponent(component as keyof T);
    removedComponent.detach();
    return removedComponent;
  }

  addComponent<K = any>(component: EntityComponent | ComponentProps<K>) {
    return this.store.addComponent<K>(this.eid, component);
  }
}

export class BehaviorManager<T> {
  constructor(private store: EntityBehaviorStore<T>, private eid: number) {}
  getBehavior<B extends EntityBehavior>(
    behavior:
      | {
          new (...args: any[]): B;
        }
      | string
  ): B | undefined {
    return this.store.getBehavior(this.eid, behavior) as B;
  }
  hasBehavior(behavior: string) {
    return this.store.hasBehavior(this.eid, behavior);
  }

  hasAllBehaviors(components: string[]) {
    return this.store.hasAllBehaviors(this.eid, components);
  }

  hasSomeBehaviors(components: string[]) {
    return this.store.hasSomeBehaviors(this.eid, components);
  }

  // TODO: Finish this implementation
  removeBehavior(behavior: string) {
    if (!this.hasBehavior(behavior)) return;
    const removedBehavior = this.getBehavior(behavior)!;
    removedBehavior!.detach();
    return removedBehavior;
  }

  // TODO: Determine whether this should be implemented or not and how
  addBehavior(behavior: EntityBehavior<T>) {
    this.store.addBehavior(this.eid, behavior);
    return behavior;
  }
}

export class Entity<T = any> {
  readonly components: ComponentManager<T>;
  readonly behaviors: BehaviorManager<T>;

  constructor(world: World<any>, readonly eid: number) {
    this.components = new ComponentManager(world.Store, eid);
    this.behaviors = new BehaviorManager(world.Store, eid); // TODO: Change this constructor args
  }
}

export class EntityBehavior<T = any> implements IEntityComponent {
  readonly name: string;
  private _parent?: number;
  private _enabled: boolean;
  readonly events: EntityBehaviorEvents;
  index?: number;

  get parent() {
    return this._parent;
  }

  get enabled() {
    return this._enabled;
  }

  constructor(
    readonly worldName: string,
    eid: number,
    index: number,
    name?: string
  ) {
    this._parent = eid;
    this.index = index;
    this.name = name ? name : this.constructor.name;
    this._enabled = true;
    this.events = new EntityBehaviorEvents();
  }

  get entity() {
    return Universe.instance
      .get(this.worldName)!
      .Store.getEntity<T>(this._parent!);
  }

  get components() {
    return Universe.instance
      .get(this.worldName)!
      .Store.getEntity<T>(this._parent!).components;
  }

  get behaviors() {
    return Universe.instance
      .get(this.worldName)!
      .Store.getEntity<T>(this._parent!).behaviors;
  }

  setIndex(index?: number) {
    this.index = index;
  }

  reset() {
    this._parent = undefined;
    this.index = undefined;
  }

  detach() {
    if (!this._parent) return;
    Universe.instance
      .get(this.worldName)!
      .Store.removeBehavior(this._parent, this.name);
    this.onDetached();
    this.events.onDetached.emit(this);
  }
  setParent(eid: number) {
    if (this._parent) this.detach();
    Universe.instance.get(this.worldName)!.Store.addBehavior(eid, this);
    this.events.onAttached.emit(this);
  }

  enable() {
    this._enabled = true;
  }

  disable() {
    this._enabled = false;
  }

  // User implemented methods
  onStart(): void | Promise<void> {}
  update(dt: number): void | Promise<void> {
    throw new Error("Update not implemented");
  }
  onDetached() {}
}
