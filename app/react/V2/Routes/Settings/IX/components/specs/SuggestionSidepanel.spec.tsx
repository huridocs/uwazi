/**
 * @jest-environment jsdom
 */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider as AtomProvider } from 'jotai';
import { ClientEntitySchema } from 'app/istore';
import { TestRouterContext } from 'V2/testing/TestRouterContext';
import { SuggestionSidepanel } from '../SuggestionSidepanel';
import { defaultData, suggestion1, property1 } from './fixtures';

jest.mock('V2/api/entities', () => ({
  getById: jest.fn().mockResolvedValue([
    {
      _id: 'entity1',
      title: 'Test Entity Title',
      sharedId: 'shared1',
      metadata: {},
    } as ClientEntitySchema,
  ]),
  getBySharedId: jest.fn().mockResolvedValue([]),
  formatter: {
    update: jest.fn().mockImplementation((entity, data) => ({ ...entity, ...data })),
  },
  save: jest.fn().mockResolvedValue({}),
  coerceValue: jest.fn().mockResolvedValue({ success: true, value: 'test' }),
}));

jest.mock('V2/api/files', () => ({
  getById: jest.fn().mockResolvedValue([]),
  update: jest.fn().mockResolvedValue({}),
}));

describe('SuggestionSidepanel', () => {
  const setShowSidepanelSpy = jest.fn();
  const onEntitySaveSpy = jest.fn();

  const renderComponent = () =>
    render(
      <TestRouterContext loaderData={defaultData}>
        <AtomProvider>
          <SuggestionSidepanel
            showSidepanel
            setShowSidepanel={setShowSidepanelSpy}
            onEntitySave={onEntitySaveSpy}
            suggestion={suggestion1}
            property={property1}
          />
        </AtomProvider>
      </TestRouterContext>
    );

  it('should render the sidepanel with entity title', async () => {
    renderComponent();
    expect(await screen.findByText('Test Entity Title')).toBeInTheDocument();
  });
});
