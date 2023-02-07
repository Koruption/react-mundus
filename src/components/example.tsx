import { useContext, useEffect } from "react";
import Entity, { EntityContext } from "../hooks/entityContext";
import useBehavior from "../hooks/useBehavior";
import World from "../hooks/worldContext";

function BehaviorOne() {
  const entity = useContext(EntityContext);
  console.log(entity);
  const { onUpdate, onStart, onDetached, create } = useBehavior(
    "MyBehavior",
    entity
  );
  onUpdate((dt) => {});
  onStart(() => {});
  onDetached(() => {});
  create();
  console.log("asasdg");
  return <></>;
}

export default function Example() {
  return (
    <World name={"MyWorld"}>
      <Entity>
        <BehaviorOne />
      </Entity>
    </World>
  );
}
