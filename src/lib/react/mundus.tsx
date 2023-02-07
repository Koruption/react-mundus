import { createContext, useContext, useEffect, useMemo } from "react";
import { EntityBehavior, Entity as _Entity } from "../entities";
import { ComponentProps } from "../types";
import { Universe, World as _World } from "../world";
import React from "react";
import { getBehaviorName } from "../utils";
import { useCreateEntity, useWorld } from "./hooks";

export module Mundus {
  export const EntityContext = createContext<_Entity<any>>(null!);
  export const WorldContext = createContext<_World<any>>(null!);

  export function __World<T>({
    name,
    children,
    sleepAfter,
  }: {
    name: string;
    sleepAfter?: number;
    children: React.ReactNode;
  }) {
    const world = useMemo(() => {
      return useWorld<T>(name)!;
    }, []);

    useEffect(() => {
      world.start();
      if (sleepAfter) world.stop(sleepAfter);
      return () => {
        world.stop();
        Universe.instance.destroyAll();
      };
    }, []);
    return (
      <Mundus.WorldContext.Provider value={world}>
        {children}
      </Mundus.WorldContext.Provider>
    );
  }

  export const World = React.memo(__World);

  export function __Entity({ children }: { children?: React.ReactNode }) {
    const entity = useMemo(() => {
      return useCreateEntity();
    }, []);
    return (
      <EntityContext.Provider value={entity}>{children}</EntityContext.Provider>
    );
  }
  export const Entity = React.memo(__Entity);

  export function Behavior<T = any>({
    behavior,
  }: {
    behavior: { new (...args: any[]): EntityBehavior<T> };
  }) {
    const entity = useContext(EntityContext);
    const world = useContext(WorldContext);
    useEffect(() => {
      entity.behaviors.addBehavior(
        new behavior(world.name, entity.eid, 0, getBehaviorName(behavior))
      );
    }, []);
    return <></>;
  }

  export type EntityComponentProps<T = any> = { name: string };
  export interface IEntityComponentProps {
    name: string;
  }

  export function Component<T = any>(props: T & IEntityComponentProps) {
    const entity = useContext(EntityContext);
    const world = useContext(WorldContext);
    const name = props.name;
    const componentProps: ComponentProps<T> = {
      name: props.name,
      props: { ...props },
    };
    useEffect(() => {
      entity.components.addComponent(componentProps);
    }, []);
    return <></>;
  }
}
