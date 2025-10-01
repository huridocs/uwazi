/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as suggestionsAPI from 'V2/api/ix/suggestions';
import api from 'app/utils/api';
import { TestAtomStoreProvider, TestRouterContext } from 'V2/testing';
import { thesauriAtom } from 'V2/atoms';
import { IXSuggestions } from '../IXSuggestions';
import { loaderData, thesauri, entity1, entity2, nestedSuggestions } from './fixtures';
import { ixStatus, IXSuggestionsLoaderResponse } from '../types';

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
  beforeEach(async () => {
    jest.resetAllMocks();
    jest.spyOn(api, 'post');
  });

  const Component = ({ data = loaderData }: { data?: IXSuggestionsLoaderResponse }) => (
    <TestRouterContext loaderData={data}>
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

  describe('Used for training', () => {
    it('should display if the entity is used for training', async () => {
      render(<Component />);
      const row1 = (await screen.findByText('Entity 1 (en)')).closest('tr');
      const row2 = (await screen.findByText('Entity 2 (en)')).closest('tr');
      expect(within(row1!).getByText('Remove from training set')).toBeInTheDocument();
      expect(within(row2!).getByText('Add to training set')).toBeInTheDocument();
    });

    it('should allow marking an entity as used for training', async () => {
      render(<Component />);
      const row = (await screen.findByText('Entity 2 (en)')).closest('tr');
      within(row!).getByText('Add to training set').click();
      expect(api.post).toHaveBeenCalledWith('suggestions/training-set', {
        data: { extractorId: 'extractor1', suggestionIds: ['suggestion2'], useForTraining: true },
        headers: {},
      });
    });

    it('should allow removing an entity from the training set', async () => {
      render(<Component />);
      const row = (await screen.findByText('Entity 1 (en)')).closest('tr');
      within(row!).getByText('Remove from training set').click();
      expect(api.post).toHaveBeenCalledWith('suggestions/training-set', {
        data: { extractorId: 'extractor1', suggestionIds: ['suggestion1'], useForTraining: false },
        headers: {},
      });
    });

    it('should only allow accepting parent elements', async () => {
      await waitFor(async () => {
        render(<Component data={nestedSuggestions} />);
        const row1 = (await screen.findByText('Entity 1 (en)')).closest('tr');
        expect(within(row1!).getByText('Add to training set')).toBeInTheDocument();
        within(row1!).getByText('Group').click();
      });
      const subrow = (await screen.findByText('Blue')).closest('tr');
      expect(within(subrow!).queryByText('Add to training set')).not.toBeInTheDocument();
    });
  });

  describe('Train model modal', () => {
    describe('form', () => {
      beforeEach(async () => {
        jest.resetAllMocks();
        jest.spyOn(api, 'post');
        jest.spyOn(suggestionsAPI, 'cancel');
        render(<Component />);
        const openModalButton = await screen.findByText('Train model');
        fireEvent.click(openModalButton);
        const modal = screen.getByRole('dialog');
        expect(await within(modal).findByText('Train model')).toBeInTheDocument();
      });

      it('should submit with the expected parameters', async () => {
        const findAfterTrain = screen.getByText('Find suggestions after training');
        const amountInput = screen.getByLabelText('Amount :');
        const submit = await within(screen.getByRole('dialog')).findByText('Train');
        expect(amountInput).toBeDisabled();
        fireEvent.click(findAfterTrain);
        expect(amountInput).not.toBeDisabled();
        expect(amountInput).toHaveValue(1000);
        fireEvent.change(amountInput, { target: { value: 1500 } });
        await act(async () => {
          await fireEvent.click(submit);
        });
        expect(api.post).toHaveBeenCalledWith('suggestions/train', {
          data: {
            extractorId: 'extractor1',
            options: { samplePolicy: 'only_marked' },
            suggestionsToFind: '1500',
          },
          headers: {},
        });
      });

      it('should submit with zero amount of find after train', async () => {
        const amountInput = screen.getByLabelText('Amount :');
        const submit = await within(screen.getByRole('dialog')).findByText('Train');
        expect(amountInput).toBeDisabled();
        await act(async () => {
          await fireEvent.click(submit);
        });
        expect(api.post).toHaveBeenCalledWith('suggestions/train', {
          data: {
            extractorId: 'extractor1',
            options: { samplePolicy: 'only_marked' },
            suggestionsToFind: 0,
          },
          headers: {},
        });
      });

      it('should submit with the selected sample policy', async () => {
        const submit = await within(screen.getByRole('dialog')).findByText('Train');
        (await screen.findByLabelText('Marked for training + all labeled entries')).click();
        await act(async () => {
          await fireEvent.click(submit);
        });
        expect(api.post).toHaveBeenCalledWith('suggestions/train', {
          data: {
            extractorId: 'extractor1',
            options: { samplePolicy: 'marked_plus_labeled' },
            suggestionsToFind: 0,
          },
          headers: {},
        });
      });
    });

    it('should show the cancel button when training', async () => {
      render(<Component data={{ ...loaderData, currentStatus: ixStatus.processing_model }} />);
      const cancelTrainingButton = await screen.findByText('Cancel');
      const openModalButton = screen.queryByText('Train model');
      expect(screen.findByText('Training model...'));
      expect(openModalButton).not.toBeInTheDocument();

      await act(async () => {
        await fireEvent.click(cancelTrainingButton);
      });
      expect(suggestionsAPI.cancel).toHaveBeenCalled();
    });

    it('should be disabled if there are selected items', async () => {
      const user = userEvent.setup();
      render(<Component />);
      const openModalButton = (await screen.findByText('Train model')).parentElement;
      expect(openModalButton).not.toBeDisabled();
      const suggestionRow = (await screen.findByRole('cell', { name: 'Entity 1 (en)' })).closest(
        'tr'
      );
      await user.click(within(suggestionRow!).getByLabelText('Select'));
      expect(openModalButton).toBeDisabled();
    });
  });

  describe('Process extractor modal', () => {
    it('should be disabled if the model is bussy', async () => {
      render(<Component data={{ ...loaderData, currentStatus: ixStatus.processing_model }} />);
      const openModalButton = (await screen.findByText('Process extractor')).parentElement;
      expect(screen.findByText('Training model...'));
      expect(openModalButton).toBeDisabled();
    });

    describe('form', () => {
      beforeEach(async () => {
        jest.resetAllMocks();
        jest.spyOn(suggestionsAPI, 'process');
        render(<Component />);
        const openModalButton = await screen.findByText('Process extractor');
        fireEvent.click(openModalButton);
        const modal = screen.getByRole('dialog');
        expect(await within(modal).findByText('Process extractor')).toBeInTheDocument();
      });

      // eslint-disable-next-line max-statements
      it('should disable the related fields when not finding suggestions', () => {
        const amountInput = screen.getByLabelText('Amount :');
        const nonProcessedSelect = screen.getByLabelText('Non processed');
        const obsoleteSelect = screen.getByLabelText('Obsolete');
        const errorSelect = screen.getByLabelText('Error');
        const acceptFromPreviousSelect = screen.getByLabelText('From previous step');
        expect(amountInput).not.toBeDisabled();
        expect(nonProcessedSelect).not.toBeDisabled();
        expect(obsoleteSelect).not.toBeDisabled();
        expect(errorSelect).not.toBeDisabled();
        fireEvent.click(screen.getByLabelText('Find suggestions for'));
        expect(amountInput).toBeDisabled();
        expect(nonProcessedSelect).toBeDisabled();
        expect(obsoleteSelect).toBeDisabled();
        expect(errorSelect).toBeDisabled();
        expect(acceptFromPreviousSelect).toBeDisabled();
      });

      it('should disable auto-accept options when not auto accepting', () => {
        const acceptFromPreviousSelect = screen.getByLabelText('From previous step');
        const acceptAllSuggestions = screen.getByLabelText('From all suggestions');
        fireEvent.click(screen.getByLabelText('Auto-accept suggestions'));
        expect(acceptFromPreviousSelect).not.toBeDisabled();
        expect(acceptAllSuggestions).not.toBeDisabled();
        fireEvent.click(screen.getByLabelText('Auto-accept suggestions'));
        expect(acceptFromPreviousSelect).toBeDisabled();
        expect(acceptAllSuggestions).toBeDisabled();
      });

      it('should autoselect auto-accept for all when not finding suggestions', () => {
        const acceptFromPreviousSelect = screen.getByLabelText('From previous step');
        const acceptAllSuggestions = screen.getByLabelText('From all suggestions');
        expect(acceptFromPreviousSelect).toBeChecked();
        expect(acceptAllSuggestions).not.toBeChecked();
        fireEvent.click(screen.getByLabelText('Find suggestions for'));
        expect(acceptAllSuggestions).toBeChecked();
        expect(acceptFromPreviousSelect).not.toBeChecked();
        expect(acceptFromPreviousSelect).toBeDisabled();
      });

      it('should autoselect auto-accept for all when setting amount to 0', () => {
        const acceptFromPreviousSelect = screen.getByLabelText('From previous step');
        const acceptAllSuggestions = screen.getByLabelText('From all suggestions');
        expect(acceptFromPreviousSelect).toBeChecked();
        expect(acceptAllSuggestions).not.toBeChecked();
        fireEvent.change(screen.getByLabelText('Amount :'), { target: { value: 0 } });
        expect(acceptAllSuggestions).toBeChecked();
        expect(acceptFromPreviousSelect).not.toBeChecked();
        expect(acceptFromPreviousSelect).toBeDisabled();
      });

      it('should not allow processing if its not finding and not accepting', () => {
        const modal = screen.getByRole('dialog');
        const processButton = within(modal).getByText('Process').parentElement;
        expect(processButton).not.toBeDisabled();
        fireEvent.click(screen.getByLabelText('Find suggestions for'));
        expect(processButton).toBeDisabled();
      });

      it('should call the endpoint with the expected default parameters', async () => {
        const modal = screen.getByRole('dialog');
        const processButton = within(modal).getByText('Process').parentElement;
        await act(async () => {
          fireEvent.click(processButton!);
        });
        expect(suggestionsAPI.process).toHaveBeenCalledWith({
          autoAccept: { enabled: false, overwriteMode: 'blank_only', source: 'previous' },
          extractorId: 'extractor1',
          find: {
            enabled: true,
            filters: { error: true, nonProcessed: true, obsolete: true },
            size: 1000,
          },
          mode: 'process_extractor',
        });
      });

      // eslint-disable-next-line max-statements
      it('should not find if all the filters are empty', async () => {
        const modal = screen.getByRole('dialog');
        const processButton = within(modal).getByText('Process').parentElement;
        const nonProcessedSelect = screen.getByLabelText('Non processed');
        const obsoleteSelect = screen.getByLabelText('Obsolete');
        const errorSelect = screen.getByLabelText('Error');
        fireEvent.click(nonProcessedSelect);
        fireEvent.click(obsoleteSelect);
        fireEvent.click(errorSelect);
        fireEvent.click(screen.getByLabelText('Auto-accept suggestions'));
        expect(screen.getByLabelText('Find suggestions for')).not.toBeChecked();
        await act(async () => {
          fireEvent.click(processButton!);
        });
        expect(suggestionsAPI.process).toHaveBeenCalledWith({
          autoAccept: { enabled: true, overwriteMode: 'blank_only', source: 'all' },
          extractorId: 'extractor1',
          find: {
            enabled: false,
            filters: { error: false, nonProcessed: false, obsolete: false },
            size: 0,
          },
          mode: 'process_extractor',
        });
      });
    });
  });

  describe('Process selected modal', () => {
    const selectRows = async () => {
      const user = userEvent.setup();
      const suggestionRow1 = (await screen.findByRole('cell', { name: 'Entity 1 (en)' })).closest(
        'tr'
      );
      const suggestionRow2 = (await screen.findByRole('cell', { name: 'Entity 2 (en)' })).closest(
        'tr'
      );

      await user.click(within(suggestionRow1!).getByRole('checkbox'));
      await user.click(within(suggestionRow2!).getByRole('checkbox'));

      expect(within(suggestionRow2!).getByRole('checkbox')).toBeChecked();
      expect(within(suggestionRow1!).getByRole('checkbox')).toBeChecked();
    };

    describe('form', () => {
      beforeEach(async () => {
        jest.resetAllMocks();
        jest.spyOn(suggestionsAPI, 'process');
        render(<Component />);
        await selectRows();
        fireEvent.click(await screen.findByText('Process selected'));
        expect(
          await within(screen.getByRole('dialog')).findByText('Process selected')
        ).toBeInTheDocument();
      });

      it('should show the users the mandatory find suggestions action', () => {
        const modal = screen.getByRole('dialog');
        const mandatoryField = within(modal).getByLabelText('Find suggestions for selected');
        expect(mandatoryField).toBeChecked();
        fireEvent.click(mandatoryField);
        expect(mandatoryField).toBeChecked();
      });

      it('should disable auto-accept options when not auto accepting', () => {
        const acceptFromPreviousSelect = screen.getByLabelText('From previous step');
        fireEvent.click(screen.getByLabelText('Auto-accept suggestions'));
        expect(acceptFromPreviousSelect).not.toBeDisabled();
        fireEvent.click(screen.getByLabelText('Auto-accept suggestions'));
        expect(acceptFromPreviousSelect).toBeDisabled();
      });

      it('should disable auto accept options when not auto accepting', () => {
        const forBlank = screen.getByLabelText('For entities with blank values');
        const overwrite = screen.getByLabelText('For all entities');
        fireEvent.click(screen.getByLabelText('Auto-accept suggestions'));
        expect(forBlank).toBeChecked();
        expect(forBlank).toBeEnabled();
        expect(overwrite).toBeEnabled();
        fireEvent.click(screen.getByLabelText('Auto-accept suggestions'));
        expect(forBlank).not.toBeEnabled();
        expect(overwrite).not.toBeEnabled();
      });

      it('should call the endpoint with the expected default parameters', async () => {
        const modal = screen.getByRole('dialog');
        const processButton = within(modal).getByText('Process').parentElement;
        const mandatoryField = within(modal).getByLabelText('Find suggestions for selected');
        expect(mandatoryField).toBeChecked();
        fireEvent.click(mandatoryField);
        await act(async () => {
          fireEvent.click(processButton!);
        });
        expect(suggestionsAPI.process).toHaveBeenCalledWith({
          autoAccept: { enabled: false, overwriteMode: 'blank_only', source: 'previous' },
          extractorId: 'extractor1',
          find: {
            enabled: true,
            filters: { error: true, nonProcessed: true, obsolete: true },
            size: 2,
            selectedSharedIds: ['shared1', 'shared2'],
          },
          mode: 'process_selected',
        });
      });

      it('should allow choosing how to accept', async () => {
        const modal = screen.getByRole('dialog');
        const processButton = within(modal).getByText('Process').parentElement;

        fireEvent.click(screen.getByLabelText('Auto-accept suggestions'));
        fireEvent.click(screen.getByLabelText('For all entities'));

        await act(async () => {
          fireEvent.click(processButton!);
        });

        expect(suggestionsAPI.process).toHaveBeenCalledWith({
          autoAccept: { enabled: true, overwriteMode: 'overwrite_all', source: 'previous' },
          extractorId: 'extractor1',
          find: {
            enabled: true,
            filters: { error: true, nonProcessed: true, obsolete: true },
            size: 2,
            selectedSharedIds: ['shared1', 'shared2'],
          },
          mode: 'process_selected',
        });
      });
    });
  });
});
