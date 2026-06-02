import { ObjectId } from 'mongodb';

type Props = {
  id?: string;
};

class Id {
  value: string;

  constructor(props: Props) {
    this.value = props?.id || new ObjectId().toString();
  }

  equals(other: Id): boolean {
    return this.value === other.value;
  }
}

export { Id };
export type { Props as IdProps };
