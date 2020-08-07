import Immutable from 'immutable';
import { DropdownList } from 'app/Forms';

import { renderConnected } from 'app/Templates/specs/utils/renderConnected';
import { HiddenColumnsDropdown } from '../HiddenColumnsDropdown';

describe('HiddenColumnsDropdown', () => {
  let component;
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
        ]),
      }),
    },
  };
  describe('render', () => {
    const render = () => {
      component = renderConnected(HiddenColumnsDropdown, props, storeState);
    };

    describe('default options', () => {
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
    });
  });
});
