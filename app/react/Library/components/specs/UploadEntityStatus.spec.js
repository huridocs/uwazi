import React from 'react';
import { fromJS as Immutable } from 'immutable';
import { shallow } from 'enzyme';
import { ItemFooter } from 'app/Layout/Lists';
import { UploadEntityStatus, mapStateToProps } from '../UploadEntityStatus';

describe('UploadEntityStatus', () => {
  describe('render', () => {
    let component;
    let props;

    beforeEach(() => {
      props = {};
    });

    const render = () => {
      component = shallow(<UploadEntityStatus {...props} />);
    };

    it('should not render anything on null status', () => {
      render();
      expect(component.find('div').length).toBe(0);

      props.status = 'status';
      render();
      expect(component.find('div').length).toBe(1);
    });

    it('should show the uploading progress bar when progress exists', () => {
      props.progress = 0;
      props.status = 'status';
      render();
      expect(component.find(ItemFooter.ProgressBar).props().progress).toBe(0);

      props.progress = 55;
      render();
      expect(component.find(ItemFooter.ProgressBar).props().progress).toBe(55);
    });

    it('should not render progressBar if progress is undefined', () => {
      props.status = 'status';
      render();
      expect(component.find(ItemFooter.ProgressBar).length).toBe(0);
    });
  });

  describe('maped state', () => {
    let store;
    let doc;

    beforeEach(() => {
      store = {
        progress: Immutable({ docId: 30 }),
        user: Immutable({ _id: 'batId' }),
      };

      doc = Immutable({
        _id: '123',
        sharedId: 'docId',
        template: 'template',
        file: {},
        documents: [{}],
      });
    });

    describe('when progress is 0', () => {
      it('should return uploading props', () => {
        store.progress = Immutable({ docId: 0 });
        doc = doc.set('documents', Immutable([]));
        const props = mapStateToProps(store, { doc });
        expect(props.status).toBe('processing');
        expect(props.message).toBe('Uploading...');
        expect(props.progress).toBe(0);
      });
    });

    describe('when status is processing', () => {
      it('should return processing props', () => {
        doc = doc.set('documents', Immutable([{ status: 'processing' }]));
        store.progress = Immutable({});
        const props = mapStateToProps(store, { doc });
        expect(props.status).toBe('processing');
        expect(props.message).toBe('Processing...');
        expect(props.progress).toBe(100);
      });
    });

    describe('when is a document, with failed status', () => {
      it('should return error props', () => {
        doc = doc.set('documents', Immutable([{ status: 'failed' }]));
        store.progress = Immutable({});
        const props = mapStateToProps(store, { doc });
        expect(props.status).toBe('danger');
        expect(props.message).toBe('Conversion failed');
      });
    });

    describe('when ready document with out template', () => {
      it('should return No type selected props', () => {
        doc = doc.set('documents', Immutable([{ status: 'ready' }]));
        doc = doc.set('template', null);
        const props = mapStateToProps(store, { doc });
        expect(props.status).toBe('warning');
        expect(props.message).toBe('No type selected');
      });
    });

    describe('when documents is not set', () => {
      it('should return empty props', () => {
        doc = doc.set('documents', null);
        store.progress = Immutable({});
        const props = mapStateToProps(store, { doc });
        expect(props).toEqual({});
      });
    });

    describe('when is uploaded, processed and with template', () => {
      it('should return empty props', () => {
        doc = doc.set('template', '1');
        doc = doc.set('documents', Immutable([{ status: 'ready' }]));
        store.progress = Immutable({});
        const props = mapStateToProps(store, { doc });
        expect(props).toEqual({});
      });
    });
  });
});
