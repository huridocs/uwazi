export enum DeliveryGuarantee {
  AtLeastOnce,
}
export interface Job {
  deliveryGuarantee?: DeliveryGuarantee;
  handle(heartbeat: () => Promise<void>): Promise<void>;
}
