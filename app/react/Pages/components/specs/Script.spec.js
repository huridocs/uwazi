/**
 * @jest-environment jsdom
 */
import React from 'react';
import { shallow } from 'enzyme';

import Script from '../Script';

const workingScript = {
  input: 'console.log("works!");',
  value: 'data:text/javascript,(function(){%0A%0Aconsole.log(%22works!%22)%3B%0A%0A})()',
};

const newScript = {
  input: 'console.log("new script!");',
  value: 'data:text/javascript,(function(){%0A%0Aconsole.log(%22new%20script!%22)%3B%0A%0A})()',
};

describe('PageCreator', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = { scriptRendered: false, onError: jest.fn() };
    document.body.innerHTML = '';
    context = {
      store: {
        getState: () => ({}),
        dispatch: jasmine.createSpy('dispatch'),
        subscribe: jasmine.createSpy('subscribe'),
      },
    };
  });

  const render = () => {
    component = shallow(<Script {...props} />, { context }).dive();
  };

  const testScriptTag = (amount, content = null, index = null) => {
    const scripts = document.body.getElementsByTagName('script');
    expect(scripts).toHaveLength(amount);
    if (amount && content) {
      const scriptTag = scripts[index || scripts.length - 1];
      expect(scriptTag.src).toBe(content);
    }
  };

  describe('render', () => {
    it('should return null', () => {
      render();
      expect(component.getElement()).toBe(null);
    });
  });

  describe('on componentDidMount', () => {
    it('should not append script if none found', () => {
      render();
      testScriptTag(0);
    });

    it('should append script as self contained external script', () => {
      props.children = workingScript.input;
      render();
      testScriptTag(1, workingScript.value);
    });

    it('should add listeners for error and unhandledrejection events.', () => {
      jest.spyOn(window, 'addEventListener').mockImplementationOnce(() => {});
      render();
      expect(window.addEventListener).toHaveBeenCalledWith('error', props.onError);
      expect(window.addEventListener).toHaveBeenCalledWith('unhandledrejection', props.onError);
    });
  });

  describe('on componentDidUpdate', () => {
    beforeEach(() => {
      props.children = workingScript.input;
      render();
    });

    it('should re-append script if changed', async () => {
      component.setProps({ children: newScript.input });
      testScriptTag(1, newScript.value);
    });

    it('should not re-append if script is not changed', () => {
      component.setProps({ children: workingScript.input });
      testScriptTag(1, workingScript.value);
    });

    it('should remove the script if the update has no new scripts.', () => {
      component.setProps({ children: null });
      testScriptTag(0);
    });

    it('should remove the listeners for error and unhandledrejection events if children has changed', () => {
      jest.spyOn(window, 'removeEventListener').mockImplementationOnce(() => {});
      component.setProps({ children: null });

      expect(window.removeEventListener).toHaveBeenCalledWith('error', props.onError);
      expect(window.removeEventListener).toHaveBeenCalledWith('unhandledrejection', props.onError);
    });
  });

  describe('on componentWillUnmount', () => {
    beforeEach(() => {
      props.children = workingScript.input;
      render();
    });

    it('should remove script.', () => {
      component.unmount();
      testScriptTag(0);
    });

    it('should remove the listeners for error and unhandledrejection events.', () => {
      jest.spyOn(window, 'removeEventListener').mockImplementationOnce(() => {});
      component.unmount();
      expect(window.removeEventListener).toHaveBeenCalledWith('error', props.onError);
      expect(window.removeEventListener).toHaveBeenCalledWith('unhandledrejection', props.onError);
    });
  });

  describe('if there are additional, unrelated script tags', () => {
    beforeEach(() => {
      document.body.appendChild(document.createElement('script'));
      props.children = workingScript.input;
      render();
    });

    it('mounting the component should not touch them.', () => {
      testScriptTag(2, workingScript.value);
    });

    it('updating the component should not touch them.', () => {
      document.body.appendChild(document.createElement('script'));
      testScriptTag(3, workingScript.value, 1);
      component.setProps({ children: newScript.input });
      testScriptTag(3, newScript.value);
    });

    it('unmount should not touch them.', () => {
      component.unmount();
      testScriptTag(1);
    });
  });
});
