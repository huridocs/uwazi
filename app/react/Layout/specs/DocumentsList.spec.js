import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';

import Doc from 'app/Library/components/Doc';
import SortButtons from 'app/Library/components/SortButtons';
import Footer from 'app/App/Footer';
import { NeedAuthorization } from 'app/Auth';

import { TilesViewer } from 'app/Layout/TilesViewer';
import { TableViewer } from 'app/Layout/TableViewer';
import { DocumentsList } from '../DocumentsList';

describe('DocumentsList', () => {
  let component;
  let instance;
  let props;
  const documents = Immutable.fromJS({
    rows: [
      { title: 'Document one', _id: '1' },
      { title: 'Document two', _id: '2' },
    ],
    totalRows: 10,
  });

  beforeEach(() => {
    props = {
      documents,
      search: { sort: 'sort' },
      filters: Immutable.fromJS({ documentTypes: [] }),
      clickOnDocument: { apply: jasmine.createSpy('clickOnDocumentApply') },
      onSnippetClick: jasmine.createSpy('onSnippetClick'),
      loadMoreDocuments: jasmine.createSpy('loadMoreDocuments'),
      storeKey: 'library',
      searchDocuments: () => {},
      deleteConnection: () => {},
      location: { query: { q: '', pathname: 'library/' } },
      selectedDocuments: {},
    };
  });

  const render = () => {
    component = shallow(<DocumentsList {...props} />);
    instance = component.instance();
  };

  describe('Graph view', () => {
    beforeEach(() => {
      props.view = 'graph';
      props.connections = { totalRows: 2 };
      props.connectionsGroups = Immutable.fromJS([
        {
          templates: [
            {
              count: 2,
            },
          ],
        },
      ]);
      props.GraphView = () => <div>GraphView</div>;
      render();
    });

    it('should not render Doc elements', () => {
      expect(component.find(Doc).length).toBe(0);
    });

    it('should render GraphView prop', () => {
      expect(component.find(props.GraphView).length).toBe(1);
      expect(component.find(props.GraphView).getElements()[0].type().props.children).toBe(
        'GraphView'
      );
    });
  });

  it('should render action buttons if passed as props', () => {
    render();
    expect(component.find('.search-list-actions').length).toBe(0);

    const ActionButtons = () => <div>action buttons</div>;
    props.ActionButtons = ActionButtons;

    render();
    expect(component.find('.search-list-actions').length).toBe(1);
    expect(
      component.find('.search-list-actions').childAt(0).getElements()[0].type().props.children
    ).toBe('action buttons');
  });

  it('should hold sortButtons with search callback and selectedTemplates', () => {
    render();
    expect(component.find(SortButtons).props().sortCallback).toBe(props.searchDocuments);
    expect(component.find(SortButtons).props().selectedTemplates).toBe(
      props.filters.get('documentTypes')
    );
  });

  it('should render a Select All button only if authorized', () => {
    render();
    expect(component.find('.select-all-documents').parent().is(NeedAuthorization)).toBe(true);
  });

  it('should bind to the clickOnDocument', () => {
    render();
    const data = component.find(TilesViewer).props();
    data.clickOnDocument();
    expect(props.clickOnDocument.apply.calls.mostRecent().args[0]).toBe(instance);
  });

  describe('Load More button', () => {
    it('should render by default a load more button', () => {
      render();

      expect(component.find('.btn-load-more').length).toBe(2);
      component
        .find('.btn-load-more')
        .at(0)
        .simulate('click', { preventDefault: () => {} });
      expect(props.loadMoreDocuments).toHaveBeenCalledWith('library', 30, 2);
    });

    it('should render a custom passed load more', () => {
      props.LoadMoreButton = () => <div className="customLoadMoreButton" />;
      render();

      expect(component.find('.btn-load-more').length).toBe(0);
      expect(component.find(props.LoadMoreButton).length).toBe(1);
    });
  });

  describe('Footer', () => {
    it('should render by default', () => {
      render();
      expect(component.find(Footer).length).toBe(1);
    });

    it('should hide the footer if prop passed', () => {
      props.hideFooter = true;
      render();
      expect(component.find(Footer).length).toBe(0);
    });
  });

  describe('Table view', () => {
    beforeEach(() => {
      props.CollectionViewer = TableViewer;
      render();
    });

    it('should not render Doc elements', () => {
      expect(component.find(Doc).length).toBe(0);
    });

    it('should render TableView component', () => {
      expect(component.find(TableViewer).length).toBe(1);
    });

    it('should bind to the loadMoreDocuments with onEndScroll', () => {
      render();
      const data = component.find(TableViewer).props();
      data.loadNextGroupOfEntities();
      expect(props.loadMoreDocuments).toHaveBeenCalledWith('library', 30, 2);
    });
  });
});
