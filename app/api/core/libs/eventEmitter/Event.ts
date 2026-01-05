type EventPayload<ExtendedPayload> = ExtendedPayload & { tenantName: string; userId: string };

abstract class Event<ExtendedPayload> {
  payload: EventPayload<ExtendedPayload>;

  constructor(payload: EventPayload<ExtendedPayload>) {
    this.payload = payload;
  }
}

export { Event };
export type { EventPayload };
