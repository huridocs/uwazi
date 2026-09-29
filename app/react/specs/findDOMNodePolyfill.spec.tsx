/**
 * @jest-environment jsdom
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import reactDom from 'react-dom';
import { findDOMNode, installFindDOMNode } from '../findDOMNodePolyfill.js';

class Box extends React.Component {
  render() {
    return <div>{this.constructor.name}</div>;
  }
}

describe('findDOMNodePolyfill', () => {
  let host: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    Reflect.set(reactDom, 'findDOMNode', null);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
    installFindDOMNode();
  });

  it('resolves a class instance to its DOM node after React 19 clears the export', () => {
    let instance: Box | null = null;
    act(() => {
      root.render(
        <Box
          ref={node => {
            instance = node;
          }}
        />
      );
    });

    installFindDOMNode();

    const installed = Reflect.get(reactDom, 'findDOMNode');
    expect(installed).toBe(findDOMNode);
    if (typeof installed !== 'function') {
      throw new Error('findDOMNode was not installed');
    }
    expect(installed(instance)).toBe(host.firstElementChild);
  });
});
