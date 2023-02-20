import React from 'react';
import { shallow } from 'enzyme';
import { fromJS } from 'immutable';

import Doc from 'app/Library/components/Doc';
import Footer from 'app/App/Footer';

import { DocumentCounter } from 'app/Layout/DocumentCounter';
import { TilesViewer } from 'app/Layout/TilesViewer';
import { TableViewer } from 'app/Layout/TableViewer';
import { LibraryHeader } from 'app/Library/components/LibraryHeader';
import { SearchBar } from 'app/Library/components/SearchBar';
import { DocumentsList } from '../DocumentsList';

describe('DocumentsList', () => {
  let component;
  let instance;
  let props;
  const documents = fromJS({
    rows: [
      { title: 'Document one', _id: '1' },
      { title: 'Document two', _id: '2' },
    ],
    totalRows: 10,
  });

  const mockNavigate = jest.fn();

  beforeEach(() => {
    props = {
      documents,
      search: { sort: 'sort' },
      filters: fromJS({ documentTypes: [] }),
      clickOnDocument: { apply: jasmine.createSpy('clickOnDocumentApply') },
      onSnippetClick: jasmine.createSpy('onSnippetClick'),
      loadMoreDocuments: jasmine.createSpy('loadMoreDocuments'),
      storeKey: 'library',
      searchDocuments: jest.fn(),
      deleteConnection: () => {},
      selectedDocuments: {},
      selectAllDocuments: jest.fn(),
      searchCentered: false,
      sortButtonsStateProperty: '',
      scrollCount: 4,
      location: { search: '?q=(searchTerm:%27asd%27)', pathname: 'library/' },
      navigate: mockNavigate,
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
      props.connectionsGroups = fromJS([
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

  describe('LibraryHeader', () => {
    it('should render a LibraryHeader with the expected props', () => {
      render();
      const libraryHeader = component.find(LibraryHeader);

      expect(libraryHeader.props()).toEqual({
        SearchBar,
        counter: <DocumentCounter entityListCount={2} entityTotal={10} />,
        selectAllDocuments: expect.any(Function),
        searchCentered: false,
        storeKey: 'library',
        filters: fromJS({ documentTypes: [] }),
        tableViewMode: false,
        scrollCount: 1,
      });

      libraryHeader.props().selectAllDocuments();
      expect(props.selectAllDocuments).toHaveBeenCalled();
    });

    it('should increase the scrollCount on each scroll event', () => {
      props.CollectionViewer = TableViewer;
      render();
      const libraryContainer = component.find('.library-load-container');
      libraryContainer.props().onScroll();
      libraryContainer.props().onScroll();

      component.update();
      expect(component.find(LibraryHeader).props().scrollCount).toBe(3);
      component.setProps({ scrollCount: 5 });
      component.update();
      expect(component.find(LibraryHeader).props().scrollCount).toBe(4);
    });
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
      expect(props.loadMoreDocuments).toHaveBeenCalledWith(30, 2, props.location, props.navigate);
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
      expect(props.loadMoreDocuments).toHaveBeenCalledWith(30, 2, props.location, props.navigate);
    });
  });
});
