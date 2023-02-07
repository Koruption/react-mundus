// import { useEffect } from "react";

import React, { createContext, useEffect, useState } from "react";
import { Universe, World as _World } from "../lib/world";

export const UniverseContext = createContext<Universe>(null!);
export const WorldContext = createContext<_World<any>>(null!);
export default function World<T = any>({
  name,
  children,
  schema,
}: {
  name: string;
  children?: React.ReactNode;
  schema?: any;
}) {
  const [world, setWorld] = useState<_World<T>>(null!);
  const [universe, setUniverse] = useState<Universe>(null!);
  useEffect(() => {
    setUniverse(Universe.instance);
    const world = universe.create<T>(name);
    setWorld(world);
  }, []);

  return (
    <UniverseContext.Provider value={universe}>
      <WorldContext.Provider value={world}>{children}</WorldContext.Provider>
    </UniverseContext.Provider>
  );
}
