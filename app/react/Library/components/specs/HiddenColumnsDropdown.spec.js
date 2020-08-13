import Immutable from 'immutable';
import { DropdownList } from 'app/Forms';

import { renderConnected } from 'app/Templates/specs/utils/renderConnected';
import { HiddenColumnsDropdown, ColumnItem, ValueItem } from '../HiddenColumnsDropdown';
import * as actions from '../../actions/libraryActions';

describe('HiddenColumnsDropdown', () => {
  let component;
  jest.mock('../../actions/libraryActions');

  const props = {
    storeKey: 'library',
  };
  const storeState = {
    library: {
      ui: Immutable.fromJS({
        tableViewColumns: Immutable.fromJS([
          {
            label: 'Title',
            name: 'title',
            hidden: false,
          },
          {
            label: 'Text',
            name: 'text',
            hidden: false,
          },
          {
            label: 'Rich text',
            name: 'rich_text',
            hidden: true,
          },
        ]),
      }),
    },
  };
  describe('render', () => {
    const render = () => {
      component = renderConnected(HiddenColumnsDropdown, props, storeState);
    };

    describe('default options', () => {
      const hiddenAction = action => ({ type: 'setTableHidden', hidden: action });
      jest.spyOn(actions, 'setTableViewAllColumnsHidden').mockImplementation(hiddenAction);
      jest.spyOn(actions, 'setTableViewColumnHidden').mockImplementation(hiddenAction);

      render();

      const dropDown = component.find(DropdownList);

      it('should contains Show all as first option', () => {
        expect(dropDown.props().data[0]).toEqual({
          label: 'Show all',
          selectAll: true,
          indeterminate: false,
          hidden: false,
        });
      });

      it('should not show title as an option', () => {
        const titleOption = dropDown.props().data.find(option => option.label === 'title');
        expect(titleOption).toBe(undefined);
      });

      describe('ColumnItem', () => {
        const item = {
          label: 'Show all',
          selectAll: true,
          indeterminate: false,
          hidden: false,
        };
        const columnItem = ColumnItem({ item });
        it('should show a checkbox and label for the passed item', () => {
          expect(columnItem.props.children[0].props.type).toEqual('checkbox');
          expect(columnItem.props.children[1]).toEqual('Show all');
        });
        it('should update indeterminate for Show all option', () => {
          const elem = { indeterminate: true };
          columnItem.props.children[0].ref(elem);
          expect(elem.indeterminate).toBe(false);
        });
      });

      describe('ValueItem', () => {
        it('should show the number of hidden columns', () => {
          const hiddenColumns = [{ label: 'Created at' }, { label: 'Template' }];
          const valueItem = ValueItem(hiddenColumns)();
          expect(valueItem.props.children[1]).toEqual('2 columns hidden');
        });
        it('should show hide columns as label if there are no hidden columns', () => {
          const hiddenColumns = [];
          const valueItem = ValueItem(hiddenColumns)();
          expect(valueItem.props.children[1]).toEqual('Hide columns');
        });
      });

      describe('onSelect', () => {
        it('should call action to hide all properties when selected is Show all and indeterminate', () => {
          const item = {
            label: 'Show all',
            selectAll: true,
            indeterminate: false,
            hidden: false,
          };
          dropDown.props().onSelect(item);
          expect(actions.setTableViewAllColumnsHidden).toBeCalledWith(true);
        });
        it('should call action update hidden property when a column is selected ', () => {
          const item = {
            name: 'text',
            selectAll: false,
            hidden: true,
          };
          dropDown.props().onSelect(item);
          expect(actions.setTableViewColumnHidden).toHaveBeenCalledWith('text', false);
        });
      });
    });
  });
});
