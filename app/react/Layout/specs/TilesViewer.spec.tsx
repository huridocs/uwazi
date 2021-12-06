import Immutable from 'immutable';

import Doc from 'app/Library/components/Doc';
import { TilesViewer } from 'app/Layout/TilesViewer';
import { renderConnected } from 'app/utils/test/renderConnected';

import { RowList } from '../Lists';

describe('TilesViewer', () => {
  let component: any;
  let props: any;
  const documents = Immutable.fromJS({
    rows: [
      { title: 'Document one', _id: '1' },
      { title: 'Document two', _id: '2' },
    ],
    totalRows: 10,
  });

  const storeState = { library: { documents, search: { sort: 'sort' } } };

  beforeEach(() => {
    props = {
      rowListZoomLevel: 0,
      storeKey: 'library',
      clickOnDocument: jasmine.createSpy('clickOnDocument'),
      onSnippetClick: jasmine.createSpy('onSnippetClick'),
      deleteConnection: () => {},
    };
  });

  const render = () => {
    component = renderConnected(TilesViewer, props, storeState);
  };

  describe('Tiles viewer', () => {
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
      const { doc } = docs.first().props() as any;
      expect(doc.get('title')).toBe('Document one');
      expect(docs.first().props().searchParams).toEqual({ sort: 'sort' });
      expect(docs.first().props().deleteConnection).toBe(props.deleteConnection);
    });

    it('should pass onClickSnippet to Doc', () => {
      const docProps = component.find(Doc).at(0).props();
      expect(docProps.onSnippetClick).toBe(props.onSnippetClick);
    });

    describe('Clicking on a document', () => {
      it('should call on props.clickOnDocument if present', () => {
        component.find(Doc).at(0).simulate('click', 'e', 'other args');
        expect(props.clickOnDocument).toHaveBeenCalledWith('e', 'other args');
      });
    });
  });
});
