import React from 'react';
import {fromJS as Immutable} from 'immutable';
import {mapStateToProps} from '../UploadEntityStatus';
import {shallow} from 'enzyme';
import {UploadEntityStatus} from '../UploadEntityStatus';
import {ItemFooter} from 'app/Layout/Lists';


describe('UploadEntityStatus', () => {
  describe('render', () => {
    let component;
    let props;

    beforeEach(() => {
      props = {};
    });

    let render = () => {
      component = shallow(<UploadEntityStatus {...props}/>);
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
        progress: Immutable({docId: 30}),
        user: Immutable({_id: 'batId'})
      };

      doc = Immutable({
        _id: '123',
        sharedId: 'docId',
        uploaded: false
      });
    });

    describe('when is a document and not uploaded', () => {
      it('should return uploading props', () => {
        const props = mapStateToProps(store, {doc});
        expect(props.status).toBe('processing');
        expect(props.message).toBe('Uploading...');
        expect(props.progress).toBe(30);
      });
    });

    describe('when progress is 0', () => {
      it('should return uploading props', () => {
        store.progress = Immutable({docId: 0});
        const props = mapStateToProps(store, {doc});
        expect(props.status).toBe('processing');
        expect(props.message).toBe('Uploading...');
        expect(props.progress).toBe(0);
      });
    });

    describe('when is a document, uploaded but not processed', () => {
      it('should return processing props', () => {
        doc = doc.set('uploaded', true);
        const props = mapStateToProps(store, {doc});
        expect(props.status).toBe('processing');
        expect(props.message).toBe('Processing...');
        expect(props.progress).toBe(100);
      });
    });

    describe('when is a document, uploaded but the conversion failed', () => {
      it('should return error props', () => {
        doc = doc.set('uploaded', true);
        doc = doc.set('processed', false);
        const props = mapStateToProps(store, {doc});
        expect(props.status).toBe('danger');
        expect(props.message).toBe('Conversion failed');
      });
    });

    describe('when is a document, uploaded, processed but without template', () => {
      it('should return No type selected props', () => {
        doc = doc.set('uploaded', true);
        doc = doc.set('processed', true);
        const props = mapStateToProps(store, {doc});
        expect(props.status).toBe('warning');
        expect(props.message).toBe('No type selected');
      });
    });

    describe('when is a document, not uploaded, not processed and without progress', () => {
      it('should return No type selected props', () => {
        doc = doc.set('uploaded', false);
        store.progress = Immutable({});
        const props = mapStateToProps(store, {doc});
        expect(props.status).toBe('danger');
        expect(props.message).toBe('Upload failed');
      });
    });

    describe('when is uploaded, processed and with template', () => {
      it('should return empty props', () => {
        doc = doc.set('uploaded', true);
        doc = doc.set('processed', true);
        doc = doc.set('template', '1');
        const props = mapStateToProps(store, {doc});
        expect(props).toEqual({});
      });
    });
  });
});
