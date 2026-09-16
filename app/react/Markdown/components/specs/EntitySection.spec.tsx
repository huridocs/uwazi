/**
 * @jest-environment jsdom
 */
import React from 'react';
import { ReactWrapper } from 'enzyme';
import { renderConnectedMount } from '#app/utils/test/renderConnected.js';
import { state } from './fixture/state.js';
import { EntitySection } from '../EntitySection.js';

describe('EntitySection Markdown', () => {
  let component: ReactWrapper;

  beforeEach(() => {
    spyOn(console, 'error');
  });

  const render = (showIf: string) => {
    component = renderConnectedMount(EntitySection, state, {
      'show-if': showIf,
      children: <div>test</div>,
    });
  };

  const testShowIf = (showIf: string, visible: boolean) => {
    render(showIf);
    expect(component.debug().includes('test')).toBe(visible);
  };

  describe('root properties Values', () => {
    it('should show if title and root dates of entity exists', () => {
      testShowIf('{ "title": { "$exists": true }}', true);
      testShowIf('{ "creationDate": { "$exists": true }}', true);
    });
    it('should not show if a root property does not exist', () => {
      testShowIf('{ "titledoesntexist": { "$exists": true }}', false);
    });
  });

  describe('metadata property Values', () => {
    it('should show if unwrapped metadata properties exist', () => {
      testShowIf('{ "metadata.description": { "$exists": true }}', true);
      testShowIf('{ "metadata.date": { "$exists": true }}', true);
      testShowIf('{ "metadata.main_image": { "$exists": true }}', true);
    });
    it('should show if a metadata property matches a value', () => {
      testShowIf('{ "metadata.description": { "$eq": "A long description" }}', true);
      testShowIf('{ "metadata.description": "A long description" }', true);
    });
    it('should not show if a metadata property does not exist', () => {
      testShowIf('{ "metadata.nonexistent": { "$exists": true }}', false);
    });
  });
  describe('inherited Values', () => {
    it('should show if inherited text exists', () => {
      testShowIf('{ "metadata.inherited_text": { "$exists": true }}', true);
    });
    it('should show if inherited text has a value', () => {
      testShowIf('{ "metadata.inherited_text": { "$in": ["something"] }}', true);
      testShowIf('{ "metadata.inherited_text": { "$nin": ["something"] }}', false);
    });
    it('should not show if inherited text has no specified value', () => {
      testShowIf('{ "metadata.inherited_text": { "$nin": ["here"] }}', true);
      testShowIf('{ "metadata.inherited_text": { "$in": ["here"] }}', false);
    });
  });
});
