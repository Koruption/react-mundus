import { useEffect, useMemo, useState } from "react";
import { Entity, EntityBehavior } from "../lib/entities";
import { Universe } from "../lib/world";

export default function useBehavior(behaviorName: string, entity: Entity) {
  let _update: (dt?: number) => void | Promise<void>;
  let _onStart: () => void | Promise<void>;
  let _onDetached: () => void;

  const onUpdate = (handler: (dt?: number) => void | Promise<void>) => {
    _update = handler;
  };

  const onStart = (handler: () => void | Promise<void>) => {
    _onStart = handler;
  };

  const onDetached = (handler: () => void) => {
    _onDetached = handler;
  };

  const create = () => {
    const behavior = new EntityBehavior(
      Universe.instance.active!.name,
      entity.eid,
      0, // this gets overridden by the store
      behaviorName
    );
    if (_update) {
      behavior.update = _update;
    }
    if (_onStart) {
      behavior.onStart = _onStart;
    }
    if (_onDetached) {
      behavior.onDetached = _onDetached;
    }
    entity.behaviors.addBehavior(behavior);
    console.log(entity.behaviors);
  };
  return {
    onUpdate: onUpdate,
    onStart: onStart,
    onDetached: onDetached,
    create: create,
  };
}
