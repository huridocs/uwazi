/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { TestAtomStoreProvider, TestRouterContext } from 'V2/testing';
import { thesauriAtom } from 'V2/atoms';
import { IXSuggestions } from '../IXSuggestions';
import { loaderData, thesauri, entity1, entity2 } from './fixtures';

jest.mock('V2/api/entities', () => ({
  ...jest.requireActual('V2/api/entities'),
  getById: jest.fn(),
  save: jest.fn(),
}));

jest.mock('V2/api/files', () => ({
  getById: jest.fn().mockResolvedValue([
    {
      _id: 'file1',
      filename: 'test.pdf',
      extractedMetadata: [
        {
          name: 'propertyName',
          selection: {
            text: 'something',
            selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
          },
        },
      ],
    },
  ]),
}));

jest.mock('V2/Components/PDFViewer', () => ({
  ...jest.requireActual('V2/Components/PDFViewer'),
  PDF: jest.fn(),
}));

const testCheckboxes = async (expectedSelected?: string) => {
  thesauri[0].values.forEach(async value => {
    const checkbox = await screen.findByLabelText(value.label);
    if (value.label === expectedSelected) {
      expect(checkbox).toBeChecked();
    } else {
      expect(checkbox).not.toBeChecked();
    }
  });
};

const openSuggestion = async (index: number, title: string) => {
  expect(await screen.findByText('Extractor 1'));
  const openButtons = screen.getAllByRole('button', { name: 'Open' });
  fireEvent.click(openButtons[index]);
  const sidepanel = await screen.findByRole('complementary');
  await within(sidepanel).findByText(title);
  await within(sidepanel).findByText('Select Property');
};

const closeSidepanel = async (text: string = 'Cancel') => {
  const sidepanel = await screen.findByRole('complementary');
  const saveButton = await within(sidepanel).findByRole('button', { name: text });
  fireEvent.click(saveButton);
};

describe('IX suggestions', () => {
  const Component = () => (
    <TestRouterContext loaderData={loaderData}>
      <TestAtomStoreProvider initialValues={[[thesauriAtom, thesauri]]}>
        <IXSuggestions />
      </TestAtomStoreProvider>
    </TestRouterContext>
  );

  it('should render the suggestions on the table', async () => {
    render(<Component />);
    expect(await screen.findByText('Extractor 1'));
    expect(await screen.findByText('Entity 1 (en)'));
  });

  it('should open the suggestions in the sidepanel with the correct values', async () => {
    const { getById } = jest.requireMock('V2/api/entities');
    getById.mockImplementation(async ({ _id }: { _id: string }) => {
      switch (_id) {
        case entity1._id:
          return Promise.resolve([entity1]);
        case entity2._id:
          return Promise.resolve([entity2]);

        default:
          return Promise.resolve([]);
      }
    });

    render(<Component />);

    await openSuggestion(0, 'Entity 1');
    await testCheckboxes('Red');
    await closeSidepanel();

    await openSuggestion(1, 'Entity 2');
    await testCheckboxes();
  });
});
