/**
 * @jest-environment jsdom
 */
import React from 'react';
import { ReactWrapper } from 'enzyme';
import { renderConnectedMount } from 'app/utils/test/renderConnected';
import { state } from './fixture/state';
import { EntitySection } from '../EntitySection';

describe('EntitySection Markdown', () => {
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
    it('should show if title and root dates of entity exists', () => {
      render(
        <EntitySection show-if='{ "title": { "$exists": true }}'>
          <span>Exists</span>
        </EntitySection>
      );
      expect(component.html()).toBe('<span>Exists</span>');

      render(
        <EntitySection show-if='{ "creationDate": { "$exists": true }}'>
          <span>Exists</span>
        </EntitySection>
      );
      expect(component.html()).toBe('<span>Exists</span>');
    });
    it('should not show if a root property does not exist', () => {
      render(
        <EntitySection show-if='{ "titledoesntexist": { "$exists": true }}'>
          <span>Exists</span>
        </EntitySection>
      );
      expect(component.html()).toBe('');
    });
  });

  describe('metadata property Values', () => {
    it('should show if unwrapped metadata properties exist', () => {
      render(
        <EntitySection show-if='{ "metadata.description": { "$exists": true }}'>
          <span>Exists</span>
        </EntitySection>
      );
      expect(component.html()).toBe('<span>Exists</span>');

      render(
        <EntitySection show-if='{ "metadata.date": { "$exists": true }}'>
          <span>Exists</span>
        </EntitySection>
      );
      expect(component.html()).toBe('<span>Exists</span>');

      render(
        <EntitySection show-if='{ "metadata.main_image": { "$exists": true }}'>
          <span>Exists</span>
        </EntitySection>
      );
      expect(component.html()).toBe('<span>Exists</span>');
    });
    it('should show if a metadata property matches a value', () => {
      render(
        <EntitySection show-if='{ "metadata.description": { "$eq": "A long description" }}'>
          <span>Exists</span>
        </EntitySection>
      );
      expect(component.html()).toBe('<span>Exists</span>');
      render(
        <EntitySection show-if='{ "metadata.description": "A long description" }'>
          <span>Exists</span>
        </EntitySection>
      );
      expect(component.html()).toBe('<span>Exists</span>');
    });
    it('should not show if a metadata property does not exist', () => {
      render(
        <EntitySection show-if='{ "metadata.nonexistent": { "$exists": true }}'>
          <span>Exists</span>
        </EntitySection>
      );
      expect(component.html()).toBe('');
    });
  });
});
