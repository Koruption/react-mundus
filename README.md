# Overview
Mundus is an ECS system developed entirely in typescript with a layer of glue for React, but the system can be used as a standalone without React as none of the Mundus core depends on React. It was built for efficiency, but some tradeoffs were made to create a better developer experience. This is not an entirely complete piece of software, but it should be good enough to build on top of! Lastly, you'll notice that some aspects of Mundus, such as behaviors, have two ways of implementing them, either by react components or class inheritance; this is because most game developers coming to the react ecosystem are used to the former rather than the latter, so I provided the choice to do either.

# Example 
```ts
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
```
