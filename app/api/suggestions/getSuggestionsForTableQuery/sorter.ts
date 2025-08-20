type Order = 'asc' | 'desc';

type Props = {
  order?: Order;
  field?: string;
};

export class Sorter {
  field: string;

  order: Order;

  constructor(props: Props) {
    this.field = props.field ?? '';
    this.order = props.order ?? 'asc';
  }

  get orderAsNumber() {
    if (this.order === 'asc') {
      return 1;
    }

    return -1;
  }

  get isActive() {
    return !!this.order && !!this.field?.length;
  }

  get $sort(): { date: 1; state: 1 } | Record<string, 1 | -1> {
    if (!this.isActive) {
      return { entityTitle: 1 };
    }

    return { [this.field]: this.orderAsNumber };
  }
}
