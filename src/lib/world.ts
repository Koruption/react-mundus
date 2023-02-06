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
  private constructor() {}
  static get instance() {
    if (!Universe._instance) {
      Universe._instance = new Universe();
      return Universe._instance;
    }
    return Universe._instance;
  }
  exists(name: string) {
    return this.worldMap.has(name);
  }
  create<T>(name: string) {
    if (this.exists(name)) throw new Error(`The world: ${name} already exists`);
    const world = new World<T>(name);
    this.worlds.push(world);
    this.worldMap.set(name, this.worlds.length - 1);
    return world;
  }
  get<T = any>(name: string) {
    if (!this.exists(name)) return;
    const worldIndex = this.worldMap.get(name)!;
    return this.worlds[worldIndex];
  }
  destroy(name: string) {
    if (!this.exists(name)) return;
    const worldToRemoveIndex = this.worldMap.get(name)!;
    const lastWorld = this.worlds.pop()!;
    this.worlds[worldToRemoveIndex] = lastWorld;
    this.worldMap.set(lastWorld.name, worldToRemoveIndex);
  }
}
