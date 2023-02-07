import { useContext, useEffect } from "react";
import Entity, { EntityContext } from "../hooks/entityContext";
import useBehavior from "../hooks/useBehavior";
import World from "../hooks/worldContext";

export function BehaviorOne() {
  const entity = useContext(EntityContext);
  const { onUpdate, onStart, onDetached, attach } = useBehavior(
    "MyBehavior",
    entity
  );
  onUpdate((dt: number) => {});
  onStart(() => {});
  onDetached(() => {});
  useEffect(() => {
    attach();
  }, []);
}

export default function Example() {
  return (
    <World name={"MyWorld"}>
      <Entity></Entity>
    </World>
  );
}
