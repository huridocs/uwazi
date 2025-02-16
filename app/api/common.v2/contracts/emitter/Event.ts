type EventProps<Payload = unknown> = {
  name: string;
  payload: Payload;
};

class Event<Payload = unknown> {
  date: Date;

  payload: Payload;

  name: string;

  constructor(props: EventProps<Payload>) {
    this.date = new Date();
    this.payload = props.payload;
    this.name = props.name;
  }
}

export { Event };

export type { EventProps };
