"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));

var _UI = require("../../../UI");

var _UploadButton = require("../UploadButton");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('UploadButton', () => {
  let component;
  let props;
  let context;
  let file = { name: 'fighting__crime--101.pdf' };

  if (typeof File === 'function') {
    file = new File([], 'fighting__crime--101.pdf');
  }

  beforeEach(() => {
    context = { confirm: jasmine.createSpy('confirm') };
    props = {
      progress: _immutable.default.fromJS({}),
      documentId: 'abc1',
      documentSharedId: 'sharedabc1',
      reuploadDocument: jasmine.createSpy('reuploadDocument'),
      storeKey: 'storeKey' };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_UploadButton.UploadButton, props), { context });
  };

  describe('render', () => {
    describe('while upload progress', () => {
      beforeEach(() => {
        props.progress = _immutable.default.fromJS({ abc1: 50 });
        render();
      });

      it('should render the progress instead of the input', () => {
        const input = component.find('input');
        expect(input.length).toBe(0);
        const span = component.find('span');
        expect(span.text()).toBe('50%');
      });
    });

    describe('while processing', () => {
      beforeEach(() => {
        render();
        component.setState({ processing: true });
      });

      it('should render a processing badge instead of the input', () => {
        const input = component.find('input');
        expect(input.length).toBe(0);
        const icon = component.find(_UI.Icon).find('[icon="cog"]');
        expect(icon.length).toBe(1);
      });
    });

    describe('when processing fails', () => {
      beforeEach(() => {
        render();
        component.setState({ processing: false, failed: true });
      });

      it('should render a failed badge with the input to reupload', () => {
        const input = component.find('input');
        expect(input.length).toBe(1);
        const icon = component.find(_UI.Icon).find('[icon="exclamation-triangle"]');
        expect(icon.length).toBe(1);
      });
    });

    describe('on complete', () => {
      beforeEach(() => {
        render();
        component.setState({ processing: false, failed: false, completed: true });
      });

      it('should render a completed badge with the input to reupload', () => {
        const input = component.find('input');
        expect(input.length).toBe(1);
        const icon = component.find(_UI.Icon).find('[icon="check"]');
        expect(icon.length).toBe(1);
      });
    });
  });

  describe('onChange', () => {
    beforeEach(() => {
      render();
    });

    it('should confirm the upload action', () => {
      const input = component.find('input');
      input.simulate('change', { target: { files: [file] } });
      expect(context.confirm).toHaveBeenCalled();
    });

    it('should upload the document', () => {
      const input = component.find('input');
      input.simulate('change', { target: { files: [file] } });
      context.confirm.calls.mostRecent().args[0].accept();
      expect(props.reuploadDocument).toHaveBeenCalledWith('abc1', file, 'sharedabc1', 'storeKey');
    });
  });
});