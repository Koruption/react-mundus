// import { useEffect } from "react";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Universe, World as _World } from "../lib/world";

export const UniverseContext = createContext<Universe>(Universe.instance);
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
  const universe = useContext(UniverseContext);
  useEffect(() => {
    return () => {
      universe.destroy(name);
    };
  }, []);
  return (
    <UniverseContext.Provider value={universe}>
      <WorldContext.Provider value={universe.create<T>(name)}>
        {children}
      </WorldContext.Provider>
    </UniverseContext.Provider>
  );
}
