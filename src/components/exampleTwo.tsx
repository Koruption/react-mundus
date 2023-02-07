import { createContext, useContext } from "react";
import { useBehavior, useCreateEntity, useWorld } from "../hooks/hooks";

export const EntityContext = createContext<number>(null!);

export function Entity({ children }: { children?: React.ReactNode }) {
  const entity = useCreateEntity();
  return (
    <EntityContext.Provider value={entity.eid}>
      {children}
    </EntityContext.Provider>
  );
}

export function BehaviorOne() {
  const eid = useContext(EntityContext);
  const { onUpdate, attach } = useBehavior("MyBehavior");
  onUpdate((dt) => {
    console.log(dt);
  });
  attach(eid);
  return <></>;
}

export default function ExampleTwo() {
  const world = useWorld("MyWorld");
  return (
    <Entity>
      <BehaviorOne />
    </Entity>
  );
}
