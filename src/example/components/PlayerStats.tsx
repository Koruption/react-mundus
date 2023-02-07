import { useContext, useMemo, useEffect } from "react";
import { Mundus } from "../../lib/react/mundus";
import { useCreateComponent } from "../../lib/react/hooks";

export function PlayerStats() {
  const entity = useContext(Mundus.EntityContext);
  const { attach } = useMemo(() => {
    return useCreateComponent({
      name: "Stats",
      props: {
        amount: 100,
        magic: 25,
        strength: 8,
      },
    });
  }, []);

  useEffect(() => {
    attach(entity.eid);
  }, []);

  return <></>;
}
