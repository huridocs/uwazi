import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';

import { Icon } from 'UI';

import { UploadButton } from '../UploadButton';

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
      progress: Immutable.fromJS({}),
      entitySharedId: 'sharedabc1',
      uploadDocument: jasmine.createSpy('uploadDocument'),
      storeKey: 'storeKey',
    };
  });

  const render = () => {
    component = shallow(<UploadButton {...props} />, { context });
  };

  describe('render', () => {
    describe('while upload progress', () => {
      beforeEach(() => {
        props.progress = Immutable.fromJS({ sharedabc1: 50 });
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
        const icon = component.find(Icon).find('[icon="cog"]');
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
        const icon = component.find(Icon).find('[icon="exclamation-triangle"]');
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
        const icon = component.find(Icon).find('[icon="check"]');
        expect(icon.length).toBe(1);
      });
    });

    describe('when entity changes', () => {
      it('should show the default status of the button instead of an error', () => {
        render();
        component.setState({ processing: false, failed: true, entitySharedId: 'sharedabc1' });
        component.update();
        expect(component.find(Icon).find('[icon="exclamation-triangle"]').length).toBe(1);
        component.setState({ processing: false, failed: true, entitySharedId: 'sharedabc2' });
        component.update();
        expect(component.find(Icon).find('[icon="exclamation-triangle"]').length).toBe(0);
      });
    });
  });

  describe('onChange', () => {
    beforeEach(() => {
      render();
    });

    it('should upload the document', () => {
      const input = component.find('input');
      input.simulate('change', { target: { files: [file] } });
      expect(props.uploadDocument).toHaveBeenCalledWith('sharedabc1', file);
    });
  });
});
