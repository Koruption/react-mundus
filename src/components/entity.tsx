import { useContext } from "react";
import { WorldContext } from "../hooks/world";
import { World } from "../lib/world";

export default function MyEntity() {
  const world = useContext<World<any>>(WorldContext);
  return (
    <Entity>
      <Behaviors>
        <SomeBehaviorOne />
        <SomeBehaviorTwo />
      </Behaviors>
      <Components>
        <SomeComponentOne />
        <SomeComponentOne />
      </Components>
    </Entity>
  );
}
