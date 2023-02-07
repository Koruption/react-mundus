import { createContext, useContext, useEffect, useState } from "react";
import { Entity as _Entity } from "../lib/entities";
import { World } from "../lib/world";
import { WorldContext } from "./worldContext";

export const EntityContext = createContext<_Entity<any>>(null!);

export default function Entity({ children }: { children?: React.ReactNode }) {
  const [entity, setEntity] = useState<_Entity>(null!);
  const world = useContext<World<any>>(WorldContext);

  useEffect(() => {
    setEntity(world.Store.create().build());
  }, []);
  return (
    <EntityContext.Provider value={entity}>{children}</EntityContext.Provider>
  );
}
