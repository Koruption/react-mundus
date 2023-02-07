import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Entity as _Entity } from "../lib/entities";
import { World } from "../lib/world";
import { WorldContext } from "./worldContext";

export const EntityContext = createContext<_Entity<any>>(null!);

export default function Entity({ children }: { children?: React.ReactNode }) {
  const world = useContext<World<any>>(WorldContext);
  return (
    <EntityContext.Provider value={world.Store.create().build()}>
      {children}
    </EntityContext.Provider>
  );
}
