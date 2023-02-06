import { BaseComponent } from "./components";

export type MappedComponent<T = {}> = BaseComponent<T> & {
  [K in keyof T]: T[K];
};

export type ComponentIndex = Array<[string, number]>;

export type SubscriberFn<T> = (packet: EventPacket<T>) => void | Promise<void>;

export type EventPacket<T> = {
  data?: T;
  timestamp: Date;
};

export type ScheduleChangeRequest = {
  eid: number;
  behaviors?: [number, string][];
  changeType: "UPDATE" | "DESTROY";
};

export type ComponentProps<T> = {
  name: string;
  props: T;
};
