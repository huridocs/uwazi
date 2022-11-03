/**
 * @jest-environment jsdom
 */
import React from 'react';
import {
  defaultState,
  renderConnected,
  renderConnectedContainer,
} from 'app/utils/test/renderConnected';
import * as uploadActions from 'app/Uploads/actions/uploadsActions';
import { ShallowWrapper } from 'enzyme';
import { act, fireEvent, screen } from '@testing-library/react';
import { fromJS } from 'immutable';
import { Provider } from 'react-redux';
import { LibraryFooter } from '../LibraryFooter';

describe('LibraryFooter', () => {
  it.each(['library', 'uploads'])(
    'should dispatch an action to open the entity creation panel',
    storeKey => {
      spyOn(uploadActions, 'newEntity').and.returnValue(async () => Promise.resolve());
      const props = { storeKey };
      const component = renderConnected(LibraryFooter, props, {});

      const createButton = component.find({ icon: 'plus' }).parent();
      createButton.simulate('click');
      expect(uploadActions.newEntity).toHaveBeenCalledWith(storeKey);
    }
  );

  it('should dispatch an action to open the import panel', () => {
    spyOn(uploadActions, 'showImportPanel').and.returnValue(async () => Promise.resolve());
    const props = { storeKey: 'library' };
    const component = renderConnected(LibraryFooter, props, {});

    const createButton = component.find({ icon: 'import-csv' }).parent();
    createButton.simulate('click');
    expect(uploadActions.showImportPanel).toHaveBeenCalled();
  });

  describe('open/close actions', () => {
    let component: ShallowWrapper;
    it('should not have footer and open button as closed at the same time', () => {
      const props = { storeKey: 'library' };
      component = renderConnected(LibraryFooter, props, {});
      expect(
        component.find('.open-actions-button').find('.toggle-footer-button').props().className
      ).not.toContain('closed');
      expect(component.find('.library-footer').props().className).toContain('closed');
    });

    const openFooter = () => {
      const openButton = component.find('.open-actions-button').find('.toggle-footer-button');
      openButton.simulate('click');
      component.update();
    };
    it('should allow opening the library-footer removing class "closed" from the element', () => {
      const props = { storeKey: 'library' };
      component = renderConnected(LibraryFooter, props, {});

      expect(component.find('.library-footer').props().className).toContain('closed');
      openFooter();
      expect(component.find('.open-actions-button').props().className).toContain('closed');
      expect(component.find('.library-footer').props().className).not.toContain('closed');
    });

    it('should allow closing the library-footer adding class "closed" to the element', () => {
      const props = { storeKey: 'library' };
      component = renderConnected(LibraryFooter, props, {});

      openFooter();
      const closeButton = component.find('.close-actions-button').find('.toggle-footer-button');
      closeButton.simulate('click');
      component.update();
      expect(component.find('.library-footer').props().className).toContain('closed');
    });

    it('should close the footer if when scrollcount increases', async () => {
      const state = {
        ...defaultState,
        exportSearchResults: { exportSearchResultsProcessing: fromJS(false) },
        user: fromJS({ _id: '1234' }),
      };
      const { renderResult, store } = renderConnectedContainer(
        <LibraryFooter storeKey="library" scrollCount={0} />,
        () => state
      );

      const openButton = screen.getByText('Show actions').parentElement!;
      await act(async () => {
        fireEvent.click(openButton);
      });

      expect(
        renderResult.container.getElementsByClassName('library-footer')[0].getAttribute('class')
      ).not.toContain('closed');

      renderResult.rerender(
        <Provider store={store}>
          <LibraryFooter storeKey="library" scrollCount={1} />
        </Provider>
      );

      expect(
        renderResult.container.getElementsByClassName('library-footer')[0].getAttribute('class')
      ).toContain('closed');
    });
  });
});
