"use strict";var _react = _interopRequireDefault(require("react"));
var _immutable = require("immutable");
var _enzyme = require("enzyme");
var _Lists = require("../../../Layout/Lists");
var _UploadEntityStatus = require("../UploadEntityStatus");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}


describe('UploadEntityStatus', () => {
  describe('render', () => {
    let component;
    let props;

    beforeEach(() => {
      props = {};
    });

    const render = () => {
      component = (0, _enzyme.shallow)(_react.default.createElement(_UploadEntityStatus.UploadEntityStatus, props));
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
      expect(component.find(_Lists.ItemFooter.ProgressBar).props().progress).toBe(0);

      props.progress = 55;
      render();
      expect(component.find(_Lists.ItemFooter.ProgressBar).props().progress).toBe(55);
    });

    it('should not render progressBar if progress is undefined', () => {
      props.status = 'status';
      render();
      expect(component.find(_Lists.ItemFooter.ProgressBar).length).toBe(0);
    });
  });

  describe('maped state', () => {
    let store;
    let doc;

    beforeEach(() => {
      store = {
        progress: (0, _immutable.fromJS)({ docId: 30 }),
        user: (0, _immutable.fromJS)({ _id: 'batId' }) };


      doc = (0, _immutable.fromJS)({
        _id: '123',
        sharedId: 'docId',
        uploaded: false,
        file: {} });

    });

    describe('when is a document and not uploaded', () => {
      it('should return uploading props', () => {
        const props = (0, _UploadEntityStatus.mapStateToProps)(store, { doc });
        expect(props.status).toBe('processing');
        expect(props.message).toBe('Uploading...');
        expect(props.progress).toBe(30);
      });
    });

    describe('when progress is 0', () => {
      it('should return uploading props', () => {
        store.progress = (0, _immutable.fromJS)({ docId: 0 });
        const props = (0, _UploadEntityStatus.mapStateToProps)(store, { doc });
        expect(props.status).toBe('processing');
        expect(props.message).toBe('Uploading...');
        expect(props.progress).toBe(0);
      });
    });

    describe('when is a document, uploaded but not processed', () => {
      it('should return processing props', () => {
        doc = doc.set('uploaded', true);
        const props = (0, _UploadEntityStatus.mapStateToProps)(store, { doc });
        expect(props.status).toBe('processing');
        expect(props.message).toBe('Processing...');
        expect(props.progress).toBe(100);
      });
    });

    describe('when is a document, uploaded but the conversion failed', () => {
      it('should return error props', () => {
        doc = doc.set('uploaded', true);
        doc = doc.set('processed', false);
        const props = (0, _UploadEntityStatus.mapStateToProps)(store, { doc });
        expect(props.status).toBe('danger');
        expect(props.message).toBe('Conversion failed');
      });
    });

    describe('when is a document, uploaded, processed but without template', () => {
      it('should return No type selected props', () => {
        doc = doc.set('uploaded', true);
        doc = doc.set('processed', true);
        const props = (0, _UploadEntityStatus.mapStateToProps)(store, { doc });
        expect(props.status).toBe('warning');
        expect(props.message).toBe('No type selected');
      });
    });

    describe('when is a document, not uploaded, not processed and without progress', () => {
      it('should return No type selected props', () => {
        doc = doc.set('uploaded', false);
        store.progress = (0, _immutable.fromJS)({});
        const props = (0, _UploadEntityStatus.mapStateToProps)(store, { doc });
        expect(props.status).toBe('danger');
        expect(props.message).toBe('Upload failed');
      });
    });

    describe('when is uploaded, processed and with template', () => {
      it('should return empty props', () => {
        doc = doc.set('uploaded', true);
        doc = doc.set('processed', true);
        doc = doc.set('template', '1');
        const props = (0, _UploadEntityStatus.mapStateToProps)(store, { doc });
        expect(props).toEqual({});
      });
    });
  });
});