import { IEntityComponent, IndexRecord } from "./classes";
import { EntityBehavior } from "./entities";
import { EntityComponentEvents } from "./events";
import { stripProps } from "./utils";
import { Universe, World } from "./world";

export class BaseComponent<T = any> {
  index: number = -1;
  eid: number = -1;
  constructor(public readonly _name: string, props: T) {
    Object.assign(this, props);
  }
}

export class EntityComponent<T = any> implements IEntityComponent {
  private _index?: number = -1;
  private _parent?: number;
  private _name: string = "";
  readonly events: EntityComponentEvents;
  get name() {
    return this._name;
  }
  get parent() {
    return this._parent;
  }
  get index() {
    return this._index;
  }
  constructor(name: string, props: T, readonly worldName: string) {
    this._name = name;
    stripProps(props);
    Object.assign(this, props);
    this.events = new EntityComponentEvents();
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
  setParent(eid: number) {
    this._parent = eid;
  }
  setIndex(newIndex: number) {
    this._index = newIndex;
  }

  reset() {
    this._parent = undefined;
    this._index = undefined;
  }

  detach() {
    if (!this._parent) return;
    Universe.instance
      .get(this.worldName)
      ?.Store.removeComponent(this._parent, this.name);
    this.events.onDetached.emit(this);
  }
}
