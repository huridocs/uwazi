/**
 * @jest-environment jsdom
 */
import { DocumentCounter, EntityCounterProps } from 'app/Layout/DocumentCounter';
import { renderConnectedMount } from 'app/Templates/specs/utils/renderConnected';

describe('DocumentCounter', () => {
  let component: any;
  const defaultProps = {
    selectedEntitiesCount: 1,
    entityListCount: 5,
    entityTotal: 100,
    totalConnectionsCount: 3,
    hiddenConnectionsCount: 0,
  };
  const render = (args?: Partial<EntityCounterProps>) => {
    const props = { ...defaultProps, ...args };
    component = renderConnectedMount(DocumentCounter, {}, props, true);
  };
  describe('connections content', () => {
    it('should show the connections count', () => {
      render();
      expect(component.text()).toBe('3 connections, 100 documents');
    });

    it('should show the number of hidden connections if there is any', () => {
      render({ hiddenConnectionsCount: 2 });
      expect(component.text()).toBe(
        // eslint-disable-next-line max-len
        '1 connections (2 hidden You don’t have rights to see these entities. To see them, someone from the organization has to share them with you.), 100 documents'
      );
    });
  });
  describe('entities content', () => {
    it('should show the number of selected, shown and total entities', () => {
      delete defaultProps.totalConnectionsCount;
      render();
      expect(component.text()).toBe(' 1  selected of 5  shown of 100  documents');
    });
  });
});
