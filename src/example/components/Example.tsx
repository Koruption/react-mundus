import { useContext, useEffect, useMemo, useState } from "react";
import { MousePositionTracker } from "../behaviors/behaviors";
import { Universe } from "../../lib/world";
import { Mundus } from "../../lib/react/mundus";
import { StatsTracker } from "./StatsTracker";
import { PlayerStats } from "./PlayerStats";

type Camera = {
  fov: number;
  aspect?: number;
  near?: number;
  far?: number;
  aperture: number;
};

export default function ExampleTwo() {
  const [counter, setCounter] = useState<number>(0);
  const handleClick = () => {
    setCounter(counter + 1);
    console.log(Universe.instance.active);
  };

  return (
    <Mundus.World name="MyWorld" sleepAfter={10000}>
      <>
        <button onClick={handleClick}> Counter: {counter} </button>
        <Container count={counter} />
      </>
      <Mundus.Entity>
        <StatsTracker />
        <Mundus.Behavior behavior={MousePositionTracker} />
        <Mundus.Component<Camera>
          name="Camera"
          fov={100}
          aperture={1.2}
          aspect={1 / 3}
        />
        <PlayerStats />
      </Mundus.Entity>
      <Mundus.Entity>
        <Mundus.Behavior behavior={MousePositionTracker} />
        <Mundus.Component<Camera> name="Camera" fov={100} aperture={1.2} />
        <PlayerStats />
      </Mundus.Entity>
    </Mundus.World>
  );
}

export function Container({ count }: { count: number }) {
  return <>Count: {count}</>;
}
