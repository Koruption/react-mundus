import { EventPacket, ScheduleChangeRequest } from "./types";
import { PriorityQueue } from "./utils";
import { World } from "./world";

export interface IScheduler<T> {
  queue: PriorityQueue<T>;
  buildQueue(): void;
  processChanges(): void;
  scheduled: { priority: number; data: T }[];
  addChange(prop: {
    eid: number;
    behaviors?: [number, string][];
    changeType: "UPDATE" | "DESTROY";
  }): void;
  hasChanges(): boolean;
}

export class BehaviorScheduler
  implements IScheduler<{ eid: number; behaviors: [number, string][] }>
{
  queue: PriorityQueue<{ eid: number; behaviors: [number, string][] }> =
    new PriorityQueue<{ eid: number; behaviors: [number, string][] }>();
  get scheduled() {
    return this.queue.items;
  }
  private entityQueueIndex: Map<number, number> = new Map();
  private changes: {
    eid: number;
    behaviors?: [number, string][];
    changeType: "UPDATE" | "DESTROY";
  }[] = [];
  constructor(protected world: World<any>) {
    world.events.onScheduleChange.subscribe((packet) => {
      this.handleChangeRequest(packet);
    });
  }
  private handleChangeRequest(
    requestPacket: EventPacket<ScheduleChangeRequest>
  ) {
    const { data } = requestPacket;
    data ? this.addChange(data) : undefined;
  }
  buildQueue() {
    const entities = this.world.Store.entities;
    for (const [eid, aggregate] of entities) {
      // prioritize queue position based on the amount of behaviors an entity has.
      // This means entities with lots of behaviors to update will be
      // updated first (higher priority)
      const queueIndex = this.queue.enqueue(
        { eid: eid, behaviors: aggregate.behaviors },
        aggregate.behaviors.length
      );
      this.entityQueueIndex.set(eid, queueIndex);
    }
  }

  // if a behavior is added or removed from an entity
  // the store will call addChange() to schedule changes
  addChange(props: {
    eid: number;
    behaviors?: [number, string][];
    changeType: "UPDATE" | "DESTROY";
  }) {
    this.changes.push(props);
  }

  // Process changes will get called each frame if there are any
  // changes to be processed
  processChanges() {
    for (const { eid, behaviors, changeType } of this.changes) {
      const queueIndex = this.entityQueueIndex.get(eid)!;
      this.queue.deleteAtIndex(queueIndex);
      if (changeType === "UPDATE") {
        if (!behaviors) return;
        const newIndex = this.queue.enqueue(
          { eid: eid, behaviors: behaviors },
          behaviors.length
        );
        this.entityQueueIndex.set(eid, newIndex);
        continue;
      }
      // DELETE
      this.entityQueueIndex.delete(eid);
    }
    // clear the changes
    this.changes = [];
  }

  hasChanges() {
    return this.changes.length > 0;
  }

  /**
   * It's removing a behavior from an entity and re-prioritizing the queue.
   */
  pruneBehaviors(
    data: { eid: number; behaviors: [number, string][] },
    spliceIndex: number
  ) {
    data.behaviors.splice(spliceIndex, 1);
    const index = this.queue.requeue(
      (behaviorGroup) => behaviorGroup.eid === data.eid,
      {
        eid: data.eid,
        behaviors: data.behaviors,
      },
      data.behaviors.length
    );
    this.entityQueueIndex.set(data.eid, index);
  }
}

/**
 * Example of update loop with change processing
 * update() {
 *  requestAnimationFrame(update)
 *  if (scheduler.hasChanges()) scheduler.processChanges();
 *  for (const behavior of this.schedulers.queue.items) {
 *    behavior.update()
 *  }
 * }
 */
