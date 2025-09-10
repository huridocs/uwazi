import { Property, PropertyProps } from 'api/templates.v2/model/Property';

type Props = {
  filter?: boolean;
  defaultfilter?: boolean;
  prioritySorting?: boolean;
} & PropertyProps;

abstract class FilterableProperty extends Property {
  filter: boolean;

  defaultfilter: boolean;

  prioritySorting: boolean;

  constructor(props: Props) {
    super(props);

    this.filter = props.filter || false;
    this.defaultfilter = props.defaultfilter || false;
    this.prioritySorting = props.prioritySorting || false;
  }
}

export { FilterableProperty };
export type { Props as FilterablePropertyProps };
