/**
 * @jest-environment jsdom
 */
import React from 'react';
import { shallow } from 'enzyme';

import { PageStyle } from '../PageStyle.js';

const uwaziStyles = () =>
  Array.from(document.head.querySelectorAll('style[data-uwazi-page-style="true"]'));

describe('PageStyle', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {};
    document.head.querySelectorAll('style[data-uwazi-page-style]').forEach(el => el.remove());
    component = null;
  });

  const render = () => {
    component = shallow(<PageStyle {...props} />);
  };

  describe('render', () => {
    it('should return null', () => {
      render();
      expect(component.getElement()).toBe(null);
    });
  });

  describe('on componentDidMount', () => {
    it('should not append style if no css', () => {
      render();
      expect(uwaziStyles()).toHaveLength(0);
    });

    it('should append style in head', () => {
      props.children = '.page-test { color: red; }';
      render();
      const styles = uwaziStyles();
      expect(styles).toHaveLength(1);
      expect(styles[0].id).toBe('uwazi-page-style-inline');
      expect(styles[0].textContent).toBe('.page-test { color: red; }');
    });

    it('should adopt SSR inline style when content matches', () => {
      const existing = document.createElement('style');
      existing.id = 'uwazi-page-style-inline';
      existing.setAttribute('data-uwazi-page-style', 'true');
      existing.textContent = '.same { }';
      document.head.appendChild(existing);

      props.children = '.same { }';
      render();
      const styles = uwaziStyles();
      expect(styles).toHaveLength(1);
      expect(styles[0].textContent).toBe('.same { }');
    });

    it('should replace SSR inline style when content differs', () => {
      const existing = document.createElement('style');
      existing.id = 'uwazi-page-style-inline';
      existing.setAttribute('data-uwazi-page-style', 'true');
      existing.textContent = 'old { }';
      document.head.appendChild(existing);

      props.children = '.page-test { color: blue; }';
      render();
      const styles = uwaziStyles();
      expect(styles).toHaveLength(1);
      expect(styles[0].textContent).toBe('.page-test { color: blue; }');
    });
  });

  describe('on componentDidUpdate', () => {
    beforeEach(() => {
      props.children = '.a { margin: 0; }';
      render();
    });

    it('should replace style if css changed', () => {
      component.setProps({ children: '.b { padding: 1px; }' });
      const styles = uwaziStyles();
      expect(styles).toHaveLength(1);
      expect(styles[0].textContent).toBe('.b { padding: 1px; }');
    });

    it('should remove style if css cleared', () => {
      component.setProps({ children: '' });
      expect(uwaziStyles()).toHaveLength(0);
    });
  });

  describe('on componentWillUnmount', () => {
    it('should remove style', () => {
      props.children = 'main { display: block; }';
      render();
      expect(uwaziStyles()).toHaveLength(1);
      component.unmount();
      expect(uwaziStyles()).toHaveLength(0);
    });
  });
});
