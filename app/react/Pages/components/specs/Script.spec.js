/**
 * @jest-environment jsdom
 */
import React from 'react';
import { shallow } from 'enzyme';

import Script from '../Script';

describe('PageCreator', () => {
  let component;
  let instance;
  let props;

  beforeEach(() => {
    props = {};

    spyOn(document.body, 'appendChild');
  });

  const render = () => {
    component = shallow(<Script {...props} />);
    instance = component.instance();
  };

  const executeCycle = (cycle, params) => {
    render();
    instance[cycle](params);
  };

  describe('render', () => {
    it('should return null', () => {
      render();
      expect(component.getElement()).toBe(null);
    });
  });

  describe('on componentDidMount', () => {
    it('should not append script if none found', () => {
      executeCycle('componentDidMount');
      expect(document.body.appendChild).not.toHaveBeenCalled();
    });

    it('should append script as self contained external script', () => {
      props.children = 'console.log("works!");';
      executeCycle('componentDidMount');
      expect(document.body.appendChild.calls.mostRecent()).toMatchSnapshot();
    });
  });

  describe('on componentDidUpdate', () => {
    beforeEach(() => {
      props.children = 'console.log("new script!");';
    });

    it('should re-append script', () => {
      executeCycle('componentDidUpdate', { children: 'console.log("works");' });
      expect(document.body.appendChild.calls.mostRecent()).toMatchSnapshot();
    });

    it('should not re-append if script is not changed', () => {
      executeCycle('componentDidUpdate', { children: 'console.log("new script!");' });
      expect(document.body.appendChild.calls.count()).toBe(1);
    });
  });
});
