import { propertyTypes } from 'shared/propertyTypes';
import { PropertySchema } from 'shared/types/commonTypes';
import { ColumnItem, ValueItem, SelectableColumn } from '../HiddenColumnsDropdownItem';

describe('ColumnItem', () => {
  const item: SelectableColumn = {
    label: 'Show all',
    name: 'show_all',
    selectAll: true,
    indeterminate: false,
    hidden: false,
    type: propertyTypes.text,
  };
  const columnItem = ColumnItem({ item });
  it('should show a checkbox and label for the passed item', () => {
    expect(columnItem.props.children[0].props.type).toEqual('checkbox');
    expect(columnItem.props.children[1].props.children).toEqual('Show all');
  });
  it('should update indeterminate for Show all option', () => {
    const elem = { indeterminate: true };
    columnItem.props.children[0].ref(elem);
    expect(elem.indeterminate).toBe(false);
  });
});

describe('ValueItem', () => {
  it('should show the number of hidden columns', () => {
    const hiddenColumns: PropertySchema[] = [
      { label: 'Created at', name: 'created_at', type: propertyTypes.text },
      { label: 'Template', name: 'template', type: propertyTypes.text },
    ];
    const valueItem = ValueItem(hiddenColumns, true, () => {})();
    expect(valueItem.props.children[1]).toEqual('2 ');
    expect(valueItem.props.children[2].props.children).toEqual('columns hidden');
  });

  it('should show hide columns as label if there are no hidden columns', () => {
    const hiddenColumns: SelectableColumn[] = [];
    const valueItem = ValueItem(hiddenColumns, true, () => {})();
    expect(valueItem.props.children[1]).toEqual('');
    expect(valueItem.props.children[2].props.children).toEqual('Hide columns');
  });

  it('should display the close icon when open', () => {
    const hiddenColumns: SelectableColumn[] = [];
    const valueItem = ValueItem(hiddenColumns, true, () => {})();
    expect(valueItem.props.children[0].props.icon).toEqual('times');
  });
});
