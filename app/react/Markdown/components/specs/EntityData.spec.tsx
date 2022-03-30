/**
 * @jest-environment jsdom
 */
import React from 'react';
import { ReactWrapper } from 'enzyme';
import { renderConnectedMount } from 'app/utils/test/renderConnected';
import { state } from './fixture/state';
import { EntityData } from '../EntityData';

describe('EntityData Markdown', () => {
  let component: ReactWrapper<
    Readonly<{}> & Readonly<{ children?: React.ReactNode }>,
    Readonly<{}>,
    React.Component<{}, {}, any>
  >;
  let consoleErrorSpy: jasmine.Spy;

  beforeEach(() => {
    consoleErrorSpy = jasmine.createSpy('consoleErrorSpy');
    spyOn(console, 'error').and.callFake(consoleErrorSpy);
  });

  const render = (innerComponent: any) => {
    component = renderConnectedMount(() => innerComponent, state);
  };

  describe('root properties Values', () => {
    it('should print title and root dates from root of entity', () => {
      render(<EntityData value-of="title" />);
      expect(component.html()).toBe('Entity 1');

      render(<EntityData value-of="creationDate" />);
      expect(component.html()).toBe('1234');
    });
  });

  describe('metadata property Values', () => {
    it('should print formatted metadata properties (sanitizing names)', () => {
      render(<EntityData value-of="description" />);
      expect(component.html()).toBe('A long description');

      render(<EntityData value-of="date" />);
      expect(component.html()).toBe('Jul 13, 1977');

      render(<EntityData value-of="Main Image" />);
      expect(component.html()).toContain('src="https://www.google.com"');
    });
  });

  describe('labels (property names)', () => {
    it('should print translated labels (sanitizing names)', () => {
      render(<EntityData label-of="title" />);
      expect(component.html()).toContain('Title translated');

      render(<EntityData label-of="Main Image" />);
      expect(component.html()).toContain('Main Image translated');
    });
  });

  describe('Error handling (until upstream implementation is implemented)', () => {
    it('should fail if no value or propertyName is provided', () => {
      render(<EntityData />);
      expect(component.html()).toEqual('');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error on EntityData: ');
      expect(consoleErrorSpy.calls.all()[2].args[0].message).toBe(
        '"value-of" or "label-of" must be provided.'
      );
    });

    it('should fail if both value and propertyName are provided', () => {
      render(<EntityData value-of="something" label-of="something else" />);
      expect(component.html()).toEqual('');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error on EntityData: ');
      expect(consoleErrorSpy.calls.all()[2].args[0].message).toBe(
        'Can\'t provide both "value-of" and "label-of".'
      );
    });
  });
});
