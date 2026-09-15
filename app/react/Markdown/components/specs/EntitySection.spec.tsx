/**
 * @jest-environment jsdom
 */
import React from 'react';
import { ReactWrapper } from 'enzyme';
import { renderConnectedMount } from '#app/utils/test/renderConnected.js';
import { state } from './fixture/state.js';
import { EntitySection } from '../EntitySection.js';

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

  const render = (showIf: string) => {
    component = renderConnectedMount(EntitySection, state, {
      'show-if': showIf,
      children: <div>test</div>,
    });
  };

  const testShowIf = (showIf: string, expected: string) => {
    render(showIf);
    expect(component.debug().includes('test')).toBe(expected === 'test');
  };

  describe('root properties Values', () => {
    it('should show if title and root dates of entity exists', () => {
      testShowIf('{ "title": { "$exists": true }}', 'test');
      testShowIf('{ "creationDate": { "$exists": true }}', 'test');
    });
    it('should not show if a root property does not exist', () => {
      testShowIf('{ "titledoesntexist": { "$exists": true }}', '');
    });
  });

  describe('metadata property Values', () => {
    it('should show if unwrapped metadata properties exist', () => {
      testShowIf('{ "metadata.description": { "$exists": true }}', 'test');
      testShowIf('{ "metadata.date": { "$exists": true }}', 'test');
      testShowIf('{ "metadata.main_image": { "$exists": true }}', 'test');
    });
    it('should show if a metadata property matches a value', () => {
      testShowIf('{ "metadata.description": { "$eq": "A long description" }}', 'test');
      testShowIf('{ "metadata.description": "A long description" }', 'test');
    });
    it('should not show if a metadata property does not exist', () => {
      testShowIf('{ "metadata.nonexistent": { "$exists": true }}', '');
    });
  });
  describe('inherited Values', () => {
    it('should show if inherited text exists', () => {
      testShowIf('{ "metadata.inherited_text": { "$exists": true }}', 'test');
    });
    it('should show if inherited text has a value', () => {
      testShowIf('{ "metadata.inherited_text": { "$in": ["something"] }}', 'test');
      testShowIf('{ "metadata.inherited_text": { "$nin": ["something"] }}', '');
    });
    it('should not show if inherited text has no specified value', () => {
      testShowIf('{ "metadata.inherited_text": { "$nin": ["here"] }}', 'test');
      testShowIf('{ "metadata.inherited_text": { "$in": ["here"] }}', '');
    });
  });
});
