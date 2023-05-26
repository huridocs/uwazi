export enum DeliveryGuarantee {
  AtLeastOnce,
}

export interface HeartbeatCallback {
  (): Promise<void>;
}
export abstract class Job {
  readonly id?: string;

  readonly namespace?: string;

  lockWindow?: number;

  deliveryGuarantee: DeliveryGuarantee = DeliveryGuarantee.AtLeastOnce;

  abstract handle(heartbeat: HeartbeatCallback): Promise<void>;
}
