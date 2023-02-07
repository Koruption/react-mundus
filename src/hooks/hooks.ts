import { Entity, EntityBehavior } from "../lib/entities";
import { Universe } from "../lib/world";

export type UpdateHandler = (dt?: number) => void | Promise<void>;
export type StartHandler = () => void | Promise<void>;
export type DetachHandler = () => void;

export function useWorld<T = any>(name: string) {
  const instance = Universe.instance;
  if (instance.exists(name)) return instance.get<T>(name);
  return instance.create<T>(name);
}

export function useCreateEntity<T = any>(worldName?: string) {
  const _worldName = worldName
    ? Universe.instance.get(worldName)!.name
    : Universe.instance.active!.name;
  return Universe.instance.get<T>(_worldName)!.Store.create().build();
}

export function useEntity<T>(eid: number, worldName?: string) {
  const world = worldName
    ? Universe.instance.get(worldName)
    : Universe.instance.active;
  return world?.Store.getEntity(eid);
}

export function useEntityBuilder<T = any>(worldName?: string) {
  const _worldName = worldName
    ? Universe.instance.get(worldName)!.name
    : Universe.instance.active!.name;
  return Universe.instance.get<T>(_worldName)!.Store.create();
}

export function useBehavior<T = any>(name: string, worldName?: string) {
  let update: UpdateHandler | undefined = undefined;
  let start: StartHandler | undefined = undefined;
  let detach: DetachHandler | undefined = undefined;
  const _worldName = worldName
    ? Universe.instance.get(worldName)!.name
    : Universe.instance.active!.name;

  const onUpdate = (handler: UpdateHandler) => {
    update = handler;
  };

  const onStart = (handler: StartHandler) => {
    start = handler;
  };

  const onDetached = (handler: DetachHandler) => {
    detach = handler;
  };

  const attach = (eid: number) => {
    const entity = Universe.instance.get(_worldName)!.Store.getEntity(eid);
    const behavior = new EntityBehavior(
      _worldName,
      eid,
      0, // this gets overridden by the store
      name
    );
    if (update) {
      behavior.update = update;
    }
    if (start) {
      behavior.onStart = start;
    }
    if (detach) {
      behavior.onDetached = detach;
    }
    entity.behaviors.addBehavior(behavior);
  };

  return {
    onUpdate: onUpdate,
    onStart: onStart,
    onDetached: onDetached,
    attach: attach,
  };
}
