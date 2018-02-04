import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import DocumentsList from 'app/Layout/DocumentsList';
import Doc from 'app/Library/components/Doc';
import SortButtons from 'app/Library/components/SortButtons';

describe('DocumentsList', () => {
  let component;
  let instance;
  let props;
  let documents = Immutable.fromJS({rows: [{title: 'Document one', _id: '1'}, {title: 'Document two', _id: '2'}], totalRows: 2});

  beforeEach(() => {
    props = {
      documents: documents,
      search: {sort: 'sort'},
      filters: Immutable.fromJS({documentTypes: []}),
      clickOnDocument: {apply: jasmine.createSpy('clickOnDocumentApply')},
      onSnippetClick: jasmine.createSpy('onSnippetClick'),
      searchDocuments: () => {},
      deleteConnection: () => {}
    };
  });

  let render = () => {
    component = shallow(<DocumentsList {...props} />);
    instance = component.instance();
  };

  describe('List view', () => {
    beforeEach(() => {
      render();
    });

    it('should render a Doc element for each document, passing the search options', () => {
      let docs = component.find(Doc);
      expect(docs.length).toBe(2);
      expect(docs.first().props().doc.get('title')).toBe('Document one');
      expect(docs.first().props().searchParams).toEqual({sort: 'sort'});
      expect(docs.first().props().deleteConnection).toBe(props.deleteConnection);
    });

    it('should pass onClickSnippet to Doc', () => {
      const docProps = component.find(Doc).at(0).props();
      expect(docProps.onSnippetClick).toBe(props.onSnippetClick);
    });

    describe('Clicking on a document', () => {
      it('should call on props.clickOnDocument if present', () => {
        component.find(Doc).at(0).simulate('click', 'e', 'other args');
        expect(props.clickOnDocument.apply.calls.mostRecent().args[0]).toBe(instance);
        expect(props.clickOnDocument.apply.calls.mostRecent().args[1][0]).toBe('e');
        expect(props.clickOnDocument.apply.calls.mostRecent().args[1][1]).toBe('other args');
      });
    });
  });

  describe('Graph view', () => {
    beforeEach(() => {
      props.view = 'graph';
      props.GraphView = () => <div>GraphView</div>;
      render();
    });

    it('should not render Doc elements', () => {
      expect(component.find(Doc).length).toBe(0);
    });

    it('should render GraphView prop', () => {
      expect(component.find(props.GraphView).length).toBe(1);
      expect(component.find(props.GraphView).getElements()[0].type().props.children).toBe('GraphView');
    });
  });

  it('should render action buttons if passed as props', () => {
    render();
    expect(component.find('.search-list-actions').length).toBe(0);

    let ActionButtons = () => <div>action buttons</div>;
    props.ActionButtons = ActionButtons;

    render();
    expect(component.find('.search-list-actions').length).toBe(1);
    expect(component.find('.search-list-actions').childAt(0).getElements()[0].type().props.children).toBe('action buttons');
  });

  it('should hold sortButtons with search callback and selectedTemplates', () => {
    render();
    expect(component.find(SortButtons).props().sortCallback).toBe(props.searchDocuments);
    expect(component.find(SortButtons).props().selectedTemplates).toBe(props.filters.get('documentTypes'));
  });
});
