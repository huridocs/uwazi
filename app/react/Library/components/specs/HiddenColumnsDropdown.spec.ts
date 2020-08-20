import Immutable from 'immutable';
import { ShallowWrapper } from 'enzyme';

import { DropdownList } from 'app/Forms';
import { renderConnected } from 'app/Templates/specs/utils/renderConnected';
import * as actions from 'app/Library/actions/libraryActions';
import { HiddenColumnsDropdown } from '../HiddenColumnsDropdown';
import { SelectableColumn } from '../HiddenColumnsDropdownItem';

describe('HiddenColumnsDropdown', () => {
  let component: ShallowWrapper;
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
      const hiddenAllAction = (action: boolean) => ({ type: 'setTableAllHidden', hidden: action });
      const hiddenAction = (name: string, action: boolean) => ({
        type: 'setTableHidden',
        name,
        hidden: action,
      });
      jest.spyOn(actions, 'setTableViewAllColumnsHidden').mockImplementation(hiddenAllAction);
      jest.spyOn(actions, 'setTableViewColumnHidden').mockImplementation(hiddenAction);

      render();

      const dropDown = component.find(DropdownList);

      it('should contains Show all as first option', () => {
        expect(dropDown.props().data[0]).toEqual({
          label: 'Show all',
          selectAll: true,
          indeterminate: true,
          hidden: false,
          type: 'text',
        });
      });

      it('should not show title as an option', () => {
        const titleOption = dropDown
          .props()
          .data.find((option: SelectableColumn) => option.label === 'title');
        expect(titleOption).toBe(undefined);
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
