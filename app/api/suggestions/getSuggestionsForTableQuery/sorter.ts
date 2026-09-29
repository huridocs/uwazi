type Order = 'asc' | 'desc';

type Props = {
  order?: Order;
  field?: string;
};

/**
 * The table's sort request, defaulted. It no longer emits a mongo sort document: translating a
 * field and a direction into a store's ordering is the store's job, behind
 * `IXSuggestionsTableQueryService`.
 */
export class Sorter {
  field: string;

  order: Order;

  constructor(props: Props) {
    this.field = props.field ?? '';
    this.order = props.order ?? 'asc';
  }
}
