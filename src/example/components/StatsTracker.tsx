import { useContext, useMemo, useEffect } from "react";
import { useCreateBehavior } from "../../lib/react/hooks";
import { Mundus } from "../../lib/react/mundus";

export function StatsTracker() {
  const entity = useContext(Mundus.EntityContext);
  const { onUpdate, attach } = useMemo(() => {
    return useCreateBehavior("MyBehavior");
  }, []);

  onUpdate((dt) => {
    // console.log(dt);
    const stats = entity.components.getComponent("Stats");
    // console.log(stats);
  });

  useEffect(() => {
    attach(entity.eid);
    setTimeout(() => {
      console.log("Behaviors ", entity.behaviors.getBehaviors());
      console.log("Components ", entity.components.getComponents());
    }, 3000);
  }, []);
  return <></>;
}
