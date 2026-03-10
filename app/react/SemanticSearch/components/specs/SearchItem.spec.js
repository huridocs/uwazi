import React from 'react';

import { shallow } from 'enzyme';

import { SearchItemComponent as SearchItem, mapDispatchToProps } from '../SearchItem';
import * as actions from '../../actions/actions';

describe('SearchItem', () => {
  let search;
  let dispatch;
  beforeEach(() => {
    search = {
      _id: 'id',
      searchTerm: 'query',
      documents: [],
      status: 'completed',
    };
    dispatch = jest.fn();
  });

  const mainContext = { confirm: jasmine.createSpy('confirm') };

  const getProps = () => ({
    search,
    ...mapDispatchToProps(dispatch),
    mainContext,
  });

  const render = () => shallow(<SearchItem {...getProps()} />);

  it('should render search details with link to results page ', () => {
    const component = render();
    expect(component).toMatchSnapshot();
  });

  it('should delete search if delete button is clicked', () => {
    jest.spyOn(actions, 'deleteSearch').mockImplementation(() => {});
    const component = render();
    component.find('.delete-search').simulate('click', { preventDefault: () => {} });
    const confirmFunction = mainContext.confirm.calls.mostRecent().args[0].accept;
    confirmFunction();
    expect(actions.deleteSearch).toHaveBeenCalledWith(search._id);
  });

  describe('when search status is inProgress', () => {
    it('should render in-progress icon, progress bar and stop button', () => {
      search.status = 'inProgress';
      const component = render();
      expect(component).toMatchSnapshot();
    });
    it('it should stop search when stop button is clicked', () => {
      jest.spyOn(actions, 'stopSearch').mockImplementation(() => {});
      search.status = 'inProgress';
      const component = render();
      component.find('.stop-search').simulate('click', { preventDefault: () => {} });
      expect(actions.stopSearch).toHaveBeenCalledWith(search._id);
    });
  });

  describe('when search status is stopped', () => {
    it('should render progress bar and resume button', () => {
      search.status = 'stopped';
      const component = render();
      expect(component).toMatchSnapshot();
    });
    it('it should resume search when resume button is clicked', () => {
      jest.spyOn(actions, 'resumeSearch').mockImplementation(() => {});
      search.status = 'stopped';
      const component = render();
      component.find('.resume-search').simulate('click', { preventDefault: () => {} });
      expect(actions.resumeSearch).toHaveBeenCalledWith(search._id);
    });
  });
});
