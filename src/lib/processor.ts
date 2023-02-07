import { logLine } from "./debug";
import { BehaviorScheduler } from "./scheduler";
import { Time } from "./time";
import { World } from "./world";

export class Processor {
  private scheduler: BehaviorScheduler;
  private hasStarted: boolean = false;
  private time: Time;
  private interval?: NodeJS.Timer;
  private animationFrameRequest?: number;
  static FPS: number = 60;

  constructor(private world: World<any>) {
    this.scheduler = new BehaviorScheduler(world);
    this.time = new Time();
  }
  stop() {
    this.animationFrameRequest
      ? cancelAnimationFrame(this.animationFrameRequest)
      : clearInterval(this.interval);
  }
  loop() {
    this.scheduler.buildQueue();
    try {
      this.loopWithAnimationFrame();
    } catch (err) {
      this.loopWithInterval();
    }
  }

  loopWithAnimationFrame() {
    this.animationFrameRequest = requestAnimationFrame(
      this.loopWithAnimationFrame
    );
    if (!this.hasStarted) this.processStarts();
    this.processUpdates();
  }

  loopWithInterval() {
    this.interval = setInterval(() => {
      if (!this.hasStarted) this.processStarts();
      this.processUpdates();
    }, 1000 / Processor.FPS);
  }

  protected processStarts() {
    this.time.start();
    for (const { data } of this.scheduler.scheduled) {
      for (const [behaviorIndex, behaviorType] of data.behaviors) {
        this.world.Store.behaviors.get(behaviorType)![behaviorIndex].onStart();
      }
    }
    this.hasStarted = !this.hasStarted;
  }
  protected processUpdates() {
    const deltaTime = this.time.getTimeDelta();
    for (const { data } of this.scheduler.scheduled) {
      let spliceIndex = 0;
      for (const [behaviorIndex, behaviorType] of data.behaviors) {
        try {
          const behavior =
            this.world.Store.behaviors.get(behaviorType)![behaviorIndex];
          if (behavior.enabled) behavior.update(deltaTime);
          spliceIndex += 1;
        } catch (err) {
          // update on behavior not implemented so we'll prune it from the
          // the queue for optimizations
          this.scheduler.pruneBehaviors(data, spliceIndex);
          spliceIndex += 1;
        }
      }
    }
    if (this.scheduler.hasChanges()) this.scheduler.processChanges();
  }
}
