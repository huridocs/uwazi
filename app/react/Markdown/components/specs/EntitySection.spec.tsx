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

  const testShowIf = (showIf: string, expected: string) => {
    render(
      <EntitySection show-if={showIf}>
        <div>test</div>
      </EntitySection>
    );
    expect(component.html()).toBe(expected);
  };

  describe('root properties Values', () => {
    it('should show if title and root dates of entity exists', () => {
      testShowIf('{ "title": { "$exists": true }}', '<div>test</div>');
      testShowIf('{ "creationDate": { "$exists": true }}', '<div>test</div>');
    });
    it('should not show if a root property does not exist', () => {
      testShowIf('{ "titledoesntexist": { "$exists": true }}', '');
    });
  });

  describe('metadata property Values', () => {
    it('should show if unwrapped metadata properties exist', () => {
      testShowIf('{ "metadata.description": { "$exists": true }}', '<div>test</div>');
      testShowIf('{ "metadata.date": { "$exists": true }}', '<div>test</div>');
      testShowIf('{ "metadata.main_image": { "$exists": true }}', '<div>test</div>');
    });
    it('should show if a metadata property matches a value', () => {
      testShowIf('{ "metadata.description": { "$eq": "A long description" }}', '<div>test</div>');
      testShowIf('{ "metadata.description": "A long description" }', '<div>test</div>');
    });
    it('should not show if a metadata property does not exist', () => {
      testShowIf('{ "metadata.nonexistent": { "$exists": true }}', '');
    });
  });
  describe('inherited Values', () => {
    it('should show if inherited text exists', () => {
      testShowIf('{ "metadata.inherited_text": { "$exists": true }}', '<div>test</div>');
    });
    it('should show if inherited text has a value', () => {
      testShowIf('{ "metadata.inherited_text": { "$in": ["something"] }}', '<div>test</div>');
      testShowIf('{ "metadata.inherited_text": { "$nin": ["something"] }}', '');
    });
    it('should not show if inherited text has no specified value', () => {
      testShowIf('{ "metadata.inherited_text": { "$nin": ["here"] }}', '<div>test</div>');
      testShowIf('{ "metadata.inherited_text": { "$in": ["here"] }}', '');
    });
  });
});
