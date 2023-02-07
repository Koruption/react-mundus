import { BehaviorScheduler } from "./scheduler";
import { WorldEvents } from "./events";
import { Entity, EntityBehavior } from "./entities";
import { ECSStore, EntityBehaviorStore } from "./store";
import { EventEmitter } from "./classes";
import { Processor } from "./processor";
import { QueryCache, QueryManager } from "./query";

export class World<T> {
  readonly ECS: ECSStore<T>;
  readonly Store: EntityBehaviorStore<T>;
  readonly events: WorldEvents;
  private processor: Processor;
  readonly name: string;
  readonly query: QueryManager<T>;
  constructor(name: string) {
    this.name = name;
    this.ECS = new ECSStore();
    this.Store = new EntityBehaviorStore(this);
    this.events = new WorldEvents();
    this.processor = new Processor(this);
    this.query = new QueryManager<T>(this.Store, new QueryCache());
  }

  destroy() {
    this.Store.flush();
  }

  start() {
    this.processor.loop();
  }

  stop() {
    this.processor.stop();
  }
}

export class Universe {
  private worlds: World<any>[] = [];
  private worldMap: Map<string, number> = new Map();
  private static _instance: Universe;
  private _activeWorld?: string;
  private constructor() {}
  static get instance() {
    if (!Universe._instance) {
      Universe._instance = new Universe();
      return Universe._instance;
    }
    return Universe._instance;
  }
  get active() {
    if (this._activeWorld) return Universe._instance.get(this._activeWorld);
  }
  setActive(world: string) {
    if (!this.exists(world))
      throw new Error(
        `The world by the name of ${world} is not currently registered in the universe.`
      );
    this._activeWorld = world;
  }
  exists(name: string) {
    return this.worldMap.has(name);
  }
  create<T>(name: string) {
    if (this.exists(name)) throw new Error(`The world: ${name} already exists`);
    const world = new World<T>(name);
    this.worlds.push(world);
    this.worldMap.set(name, this.worlds.length - 1);
    if (!this.active) this.setActive(name);
    return world;
  }
  get<T = any>(name: string): World<T> | undefined {
    if (!this.exists(name)) return;
    const worldIndex = this.worldMap.get(name)!;
    return this.worlds[worldIndex] as World<T>;
  }
  destroy(name: string) {
    if (!this.exists(name)) return;
    const worldToRemoveIndex = this.worldMap.get(name)!;
    const lastWorld = this.worlds.pop()!;
    const worldToRemove = this.worlds[worldToRemoveIndex];
    worldToRemove.destroy();
    this.worlds[worldToRemoveIndex] = lastWorld;
    this.worldMap.set(lastWorld.name, worldToRemoveIndex);
  }
  destroyAll() {
    for (const world of this.worlds) {
      world.destroy();
    }
    this.worldMap.clear();
    this.worlds = [];
    this._activeWorld = undefined;
  }
}
