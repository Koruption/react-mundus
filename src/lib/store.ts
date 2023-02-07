import { BehaviorManager, Entity, EntityBehavior } from "./entities";
import { BaseComponent, EntityComponent } from "./components";
import { ComponentIndex, ComponentProps } from "./types";
import {
  Component,
  EntityIdManager,
  setComponentIndex,
  setComponentParent,
  clearComponent,
  ActorBuilder,
  getBehaviorName,
  BatchedActorBuilder,
} from "./utils";
import { World } from "./world";

export class ECSStore<T> {
  readonly components: Map<string, BaseComponent[]>;
  readonly entities: Map<number, ComponentIndex>;
  private entityIds: EntityIdManager<number>;

  constructor() {
    this.components = new Map();
    this.entities = new Map();
    this.entityIds = new EntityIdManager<number>(0, (id) => ++id);
  }

  flush() {
    this.components.clear();
    this.entities.clear();
  }

  addEntity(components: Partial<T> = {}) {
    const eid = this.entityIds.generateId();
    const componentIndices: ComponentIndex = [];
    for (const compPropKey in components) {
      const component = Component(compPropKey, components[compPropKey]!);

      setComponentParent(eid, component);
      const componentIndex = this.components.get(component._name);

      if (!componentIndex) {
        this.components.set(component._name, [component]);
        setComponentIndex(component, 0);
        componentIndices.push([component._name, 0]);
        continue;
      }
      const insertIndex = this.components.get(component._name)!.length - 1;
      this.components.get(component._name)!.push(component);
      setComponentIndex(component, insertIndex);
      componentIndices.push([component._name, insertIndex]);
    }
    this.entities.set(eid, componentIndices);

    return eid;
  }

  getEntity(eid: number) {
    const components = [];
    if (!this.entityExists(eid)) return undefined;
    for (const [compKey, compIndex] of this.entities.get(eid)!) {
      components.push(this.components.get(compKey)![compIndex]);
    }
    return components;
  }

  hasComponent<K extends keyof T>(eid: number, name: K) {
    const entity = this.entities.get(eid);
    if (!entity) return undefined;
    for (const [compKey] of entity) {
      if (compKey === name) return true;
    }
  }

  getComponent<K extends keyof T>(eid: number, name: K) {
    const entity = this.entities.get(eid);
    if (!entity) return undefined;
    for (const [compKey, compIndex] of entity) {
      if (compKey === name) return this.components.get(compKey)![compIndex];
    }
    return undefined;
  }

  componentExists(name: string) {
    return this.components.has(name);
  }

  entityExists(eid: number) {
    return this.entities.has(eid);
  }

  addComponent<K extends keyof T>(eid: number, compType: K, component: T[K]) {
    const hasComponent = this.getComponent(eid, compType);
    if (hasComponent)
      throw new Error(
        `Component ${compType as string} already exists on the entity: ${eid}`
      );
    let compIndx!: number;
    const _component = Component(compType as string, component);
    setComponentParent(eid, _component);
    if (!this.componentExists(_component._name)) {
      this.components.set(_component._name, [_component]);
      setComponentIndex(_component, 0);
      return;
    }
    setComponentIndex(
      _component,
      this.components.get(_component._name)!.length - 1
    );
    this.entities.get(eid)!.push([_component._name, compIndx]);
  }

  addComponents(eid: number, components: Partial<T>) {
    for (const compKey in components) {
      this.addComponent(eid, compKey, components[compKey]!);
    }
  }

  removeComponent<K extends keyof T>(eid: number, name: K) {
    if (!this.hasComponent(eid, name)) return undefined;
    // get the component to be removed
    const component = this.getComponent(eid, name)!;

    // get all the components of this type
    const components = this.components.get(name as string)!;

    //get last components
    const lastComponent = components.pop()!;

    // remove component and swap with last component
    components[component.index] = lastComponent;

    // update the last component's index with the new index
    setComponentIndex(lastComponent, component.index);

    // update the last component's entity data on the entity map
    this.entities
      .get(lastComponent.eid)!
      .map((e) =>
        e[0] === lastComponent._name
          ? [lastComponent._name, lastComponent.index]
          : e
      );

    // reset index and parent of removed component
    clearComponent(component);

    return component;
  }

  removeEntity(eid: number) {
    const entity = this.entities.get(eid);
    if (!entity) return undefined;
    for (const [compKey] of entity) {
      this.removeComponent(eid, compKey as any);
    }
    this.entities.delete(eid);
  }
}

export class EntityBehaviorStore<T> {
  private _components: Map<string, EntityComponent<T>[]> = new Map();
  private _behaviors: Map<string, EntityBehavior<T>[]> = new Map();
  private _entities: Map<
    number,
    { components: [number, string][]; behaviors: [number, string][] }
  > = new Map();
  private entityIds: number = 0;
  constructor(private world: World<any>) {}
  get entities() {
    return this._entities;
  }
  get behaviors() {
    return this._behaviors;
  }
  get components() {
    return this._components;
  }
  private generateEID() {
    return (this.entityIds += 1);
  }

  flush() {
    this.components.clear();
    this._behaviors.clear();
    this.entities.clear();
    this.entityIds = 0;
  }

  create() {
    return new ActorBuilder<T>(this);
  }

  createMany(amount: number) {
    return new BatchedActorBuilder<T>(this, amount);
  }

  getEntity<T = any>(eid: number) {
    return new Entity<T>(this.world, eid);
  }

  destroy(eid: number) {
    const entityRecord = this._entities.get(eid);
    if (!entityRecord) return;
    this.removeAllBehaviors(eid);
    this.removeAllComponents(eid);
    this._entities.delete(eid);
    this.world.events.onScheduleChange.emit({
      eid: eid,
      changeType: "DESTROY",
    });
    this.world.events.onEntityDestroyed.emit(eid);
  }

  private removeAllComponents(eid: number) {
    const entityRecord = this._entities.get(eid);
    if (!entityRecord) return;
    let indexToRemove = 0;
    for (const [index, compKey] of entityRecord.components) {
      const lastItem = this._components.get(compKey)!.pop()!;
      // swap places to remove the hole
      this._components.get(compKey)![index] = lastItem;
    }
    entityRecord.components = [];
  }
  private removeAllBehaviors(eid: number) {
    const entityRecord = this._entities.get(eid);
    if (!entityRecord) return;
    for (const [index, behaviorType] of entityRecord.behaviors) {
      const lastItem = this._behaviors.get(behaviorType)!.pop()!;
      // swap places to remove the hole
      this._behaviors.get(behaviorType)![index] = lastItem;
    }
    entityRecord.behaviors = [];
  }

  removeComponent(eid: number, component: string) {
    const entityRecord = this._entities.get(eid);
    if (!entityRecord) return;
    let indexToRemove = 0;
    for (const [index, compKey] of entityRecord.components) {
      if (compKey === component) {
        if (this._components.get(compKey)?.length === 1) {
          const removedComponent = this._components.get(compKey)!.pop()!;
          entityRecord.components.splice(indexToRemove, 1);
          removedComponent.reset();
          return;
        }
        const lastItem = this._components.get(component)!.pop()!;
        const removedComponent = this._components.get(component)![index];
        // swap places to remove the hole
        this._components.get(component)![index] = lastItem;
        entityRecord.components.splice(indexToRemove, 1);
        lastItem.setIndex(index);
        removedComponent.reset();
        break;
      }
      indexToRemove += 1;
    }
  }

  // Used for adding known components
  private _addComponent<K = T>(eid: number, component: EntityComponent<K>) {
    const entityRecord = this._entities.get(eid);
    if (!entityRecord) return;
    if (this.hasComponent(eid, component.name)) {
      throw new Error(`Component already exists on the entity: ${eid}.`);
    }
    this._components.has(component.name)
      ? this._components.get(component.name)!.push(component as EntityComponent)
      : this._components.set(component.name, [component as EntityComponent]);
    entityRecord.components.push([
      this._components.get(component.name)!.length - 1,
      component.name,
    ]);
    component.setIndex(this._components.get(component.name)!.length - 1)
    component.setParent(eid)
    return component;
  }

  private addRuntimeComponent<K = any>(
    eid: number,
    component: ComponentProps<K>
  ) {;
    ;
    return this._addComponent(eid, new EntityComponent<K>(
      component.name,
      component.props,
      this.world.name
    ));
  }

  addComponent<K = any>(
    eid: number,
    component: EntityComponent<T> | ComponentProps<K>
  ) {
    if (
      component instanceof EntityComponent<T> ||
      component instanceof EntityComponent<any>
    ) {
      this._addComponent(eid, component);
      return;
    }
    return this.addRuntimeComponent(eid, component);
  }

  addBehavior(eid: number, behavior: EntityBehavior) {
    const entityRecord = this._entities.get(eid);
    if (!entityRecord) return;
    if (this.hasComponent(eid, behavior.name)) {
      throw new Error(`Component already exists on the entity: ${eid}.`);
    }
    this._behaviors.has(behavior.name)
      ? this._behaviors.get(behavior.name)!.push(behavior)
      : this._behaviors.set(behavior.name, [behavior]);
    this._behaviors.has(behavior.name)
      ? behavior.setIndex(this._behaviors.get(behavior.name)!.length - 1)
      : behavior.setIndex(0);
    behavior.setParent(eid);
    entityRecord.behaviors.push([
      this._behaviors.get(behavior.name)!.length - 1,
      behavior.name,
    ]);
    this.world.events.onScheduleChange.emit({
      eid: eid,
      changeType: "UPDATE",
      behaviors: entityRecord.behaviors,
    });
  }

  removeBehavior(
    eid: number,
    behavior: { new (...args: any[]): EntityBehavior } | string
  ) {
    const entityRecord = this._entities.get(eid);
    if (!entityRecord) return;
    let indexToRemove = 0;
    const behaviorName = getBehaviorName(behavior);
    for (const [index, behaviorType] of entityRecord.behaviors) {
      if (behaviorType === behaviorName) {
        if (this._behaviors.get(behaviorType)?.length === 1) {
          const removedBehavior = this._behaviors.get(behaviorType)!.pop()!;
          entityRecord.behaviors.splice(indexToRemove, 1);
          removedBehavior.reset();
          this.world.events.onScheduleChange.emit({
            eid: eid,
            changeType: "UPDATE",
            behaviors: entityRecord.behaviors,
          });
          return;
        }
        const lastItem = this._behaviors.get(behaviorType)!.pop()!;
        const removedBehavior = this._behaviors.get(behaviorType)![index];
        // swap places to remove the hole
        this._behaviors.get(behaviorType)![index] = lastItem;
        entityRecord.behaviors.splice(indexToRemove, 1);
        lastItem.setIndex(index);
        removedBehavior.reset();
        break;
      }
      indexToRemove += 1;
    }
    this.world.events.onScheduleChange.emit({
      eid: eid,
      changeType: "UPDATE",
      behaviors: entityRecord.behaviors,
    });
  }

  getBehaviors(eid: number) {
    const entityRecord = this._entities.get(eid);
    if (!entityRecord) return;
    const behaviors = entityRecord.behaviors;
    const results = [];
    for (const [index, behaviorType] of behaviors) {
      results.push(this._behaviors.get(behaviorType)![index]);
    }
    return results;
  }

  getBehavior<B extends EntityBehavior = any>(
    eid: number,
    behavior: { new (...args: any[]): B } | string
  ): B | undefined {
    const entityRecord = this._entities.get(eid);
    if (!entityRecord) return;
    const behaviors = entityRecord.behaviors;
    const behaviorName = getBehaviorName(behavior);
    for (const [index, behaviorType] of behaviors) {
      if (behaviorType === behaviorName) {
        return this._behaviors.get(behaviorType)![index] as B;
      }
    }
  }

  hasBehavior(
    eid: number,
    behavior: { new (...args: any[]): EntityBehavior } | string
  ) {
    const entityRecord = this._entities.get(eid);
    if (!entityRecord) return;
    const behaviors = entityRecord.behaviors;
    const behaviorName = getBehaviorName(behavior);
    for (const _behavior of behaviors) {
      if (_behavior[1] === behaviorName) {
        return true;
      }
    }
    return false;
  }

  _create(
    behaviors: { new (...args: any): EntityBehavior<T> }[],
    components: Partial<T>
  ) {
    const eid = this.generateEID();
    const _entity = new Entity<T>(this.world, eid);

    const _components: [number, string][] = [];
    const _behaviors: [number, string][] = [];

    // add components to component store
    for (const compKey in components) {
      const component = new EntityComponent(
        compKey,
        components[compKey],
        this.world.name
      );
      component.setParent(eid);
      this._components.has(compKey)
        ? this._components.get(compKey)!.push(component as EntityComponent<any>)
        : this._components.set(compKey, [component as EntityComponent<any>]);
      component.setIndex(this._components.get(compKey)!.length - 1);
      _components.push([this._components.get(compKey)!.length - 1, compKey]);
      continue;
    }

    // add behaviors to behavior store
    for (const behavior of behaviors) {
      const _behavior = new behavior(this.world.name, eid);
      _behavior.setParent(eid);
      this._behaviors.get(_behavior.name)
        ? this._behaviors.get(_behavior.name)!.push(_behavior)
        : this._behaviors.set(_behavior.name, [_behavior]);
      _behaviors.push([
        this._behaviors.get(_behavior.name)!.length - 1,
        _behavior.name,
      ]);
      _behavior.setIndex(this._behaviors.get(_behavior.name)!.length - 1);
      this.world.events.onEntityCreated.emit(_entity);
    }

    this._entities.set(_entity.eid, {
      components: _components,
      behaviors: _behaviors,
    });

    return _entity;
  }

  getComponents(eid: number) {
    const entityRecord = this._entities.get(eid);
    if (!entityRecord) return;
    const components = entityRecord.components;
    const _results = [];
    for (const [index, compKey] of components) {
      _results.push(this._components.get(compKey)![index]);
    }
    return _results;
  }

  getComponent(eid: number, compType: string) {
    const entityRecord = this._entities.get(eid);
    if (!entityRecord) return;
    const components = entityRecord.components;
    for (const [index, compKey] of components) {
      if (compKey === compType) return this._components.get(compKey)![index];
    }
  }

  hasComponent(eid: number, compType: string) {
    return this.getComponent(eid, compType) !== undefined;
  }

  hasAllComponents(eid: number, compTypes: string[]) {
    for (const component of compTypes) {
      if (this.getComponent(eid, component) === undefined) return false;
    }
    return true;
  }
  hasSomeComponents(eid: number, compTypes: string[]) {
    for (const component of compTypes) {
      if (this.getComponent(eid, component) !== undefined) return true;
    }
    return false;
  }

  hasAllBehaviors(eid: number, behaviors: string[]) {
    for (const behavior of behaviors) {
      if (this.getBehavior(eid, behavior) === undefined) return false;
    }
    return true;
  }
  hasSomeBehaviors(eid: number, behaviors: string[]) {
    for (const behavior of behaviors) {
      if (this.getBehavior(eid, behavior) !== undefined) return true;
    }
    return false;
  }
}
