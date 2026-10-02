/**
 * @jest-environment jsdom
 */
import React, { act } from 'react';
import { ReactWrapper } from 'enzyme';
import { screen } from '@testing-library/react';
import Immutable from 'immutable';
import { renderConnectedContainer, renderConnectedMount } from '#app/utils/test/renderConnected.js';
import { entityPageViewAtom } from '#V2/atoms/entityPageViewAtom.js';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import type { EntityPageViewData } from '#V2/Routes/Entity/Components/EntityPageView/types.js';
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

  it('uses the entity v2 page atom when redux entity is empty', async () => {
    const pageView: EntityPageViewData = {
      pageSharedId: 'page1',
      pageView: { metadata: { content: '' } },
      itemLists: [],
      datasets: {},
      entityRaw: {
        _id: 'ent1',
        sharedId: 'shared1',
        language: 'en',
        title: 'Entity 1',
        template: 't1',
        creationDate: 1234,
        user: 'user1',
        metadata: {
          description: [{ value: 'A long description' }],
        },
      },
    };

    await act(async () => {
      renderConnectedContainer(
        <TestAtomStoreProvider initialValues={[[entityPageViewAtom, pageView]]}>
          <EntitySection show-if='{ "metadata.description": { "$exists": true }}'>
            <div>from atom</div>
          </EntitySection>
        </TestAtomStoreProvider>,
        () => ({
          ...state,
          entityView: { entity: Immutable.fromJS({}) },
        })
      );
    });

    expect(screen.getByText('from atom')).toBeInTheDocument();
  });
});
