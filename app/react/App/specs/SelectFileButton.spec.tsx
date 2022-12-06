/**
 * @jest-environment jsdom
 */

import { shallow, ShallowWrapper } from 'enzyme';
import React, { useRef } from 'react';
import { SelectFileButton } from '../SelectFileButton';

jest.mock('react', () => {
  const originReact = jest.requireActual('react');
  const mUseRef = jest.fn();
  return {
    ...originReact,
    useRef: mUseRef,
  };
});

describe('SelectFileButton', () => {
  let component: ShallowWrapper;

  it('should render children', () => {
    component = shallow(
      <SelectFileButton onFileImported={jest.fn()} id="file-button">
        <div id="test" />
      </SelectFileButton>
    );
    expect(component.contains(<div id="test" />)).toBe(true);
  });

  it('should react to click events', () => {
    const mRef = { current: { click: jest.fn() } };
    // @ts-ignore
    useRef.mockReturnValueOnce(mRef);
    const mountComp = shallow(
      <SelectFileButton onFileImported={jest.fn()} id="file-button">
        <span />
      </SelectFileButton>
    );
    mountComp.simulate('click');
    expect(mRef.current.click).toHaveBeenCalled();
  });

  it('should pass correct file when input value changes', () => {
    const event = { target: { files: [{ name: 'file1.csv' }] } };
    const mockFunc = jest.fn();
    const mountComp = shallow(
      <SelectFileButton onFileImported={mockFunc} id="file-button">
        <span />
      </SelectFileButton>
    );
    mountComp.find('input[type="file"]').first().simulate('change', event);

    expect(mockFunc).toHaveBeenCalledWith(event.target.files[0]);
  });
});
