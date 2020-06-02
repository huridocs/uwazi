import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';

import Doc from 'app/Library/components/Doc';
import SortButtons from 'app/Library/components/SortButtons';
import Footer from 'app/App/Footer';
import { NeedAuthorization } from 'app/Auth';

import { DocumentsList } from '../DocumentsList';
import { RowList } from '../Lists';

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
    };
  });

  const render = () => {
    component = shallow(<DocumentsList {...props} />);
    instance = component.instance();
  };

  describe('List view', () => {
    beforeEach(() => {
      render();
    });

    it('should pass to RowList the zoom level passed to component', () => {
      expect(component.find(RowList).props().zoomLevel).toBe(0);
      props.rowListZoomLevel = 3;
      render();
      expect(component.find(RowList).props().zoomLevel).toBe(3);
    });

    it('should render a Doc element for each document, passing the search options', () => {
      const docs = component.find(Doc);
      expect(docs.length).toBe(2);
      expect(
        docs
          .first()
          .props()
          .doc.get('title')
      ).toBe('Document one');
      expect(docs.first().props().searchParams).toEqual({ sort: 'sort' });
      expect(docs.first().props().deleteConnection).toBe(props.deleteConnection);
    });

    it('should pass onClickSnippet to Doc', () => {
      const docProps = component
        .find(Doc)
        .at(0)
        .props();
      expect(docProps.onSnippetClick).toBe(props.onSnippetClick);
    });

    describe('Clicking on a document', () => {
      it('should call on props.clickOnDocument if present', () => {
        component
          .find(Doc)
          .at(0)
          .simulate('click', 'e', 'other args');
        expect(props.clickOnDocument.apply.calls.mostRecent().args[0]).toBe(instance);
        expect(props.clickOnDocument.apply.calls.mostRecent().args[1][0]).toBe('e');
        expect(props.clickOnDocument.apply.calls.mostRecent().args[1][1]).toBe('other args');
      });
    });
  });

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
      expect(
        component
          .find(props.GraphView)
          .getElements()[0]
          .type().props.children
      ).toBe('GraphView');
    });

    it('should show the connections count', () => {
      expect(component.text()).toContain('2 connections');
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
      component
        .find('.search-list-actions')
        .childAt(0)
        .getElements()[0]
        .type().props.children
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
    expect(
      component
        .find('.select-all-documents')
        .parent()
        .is(NeedAuthorization)
    ).toBe(true);
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
});
