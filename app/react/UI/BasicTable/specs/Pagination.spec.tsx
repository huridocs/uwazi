/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { Pagination } from '../Pagination';

describe('Pagination', () => {
  const props = {
    onPageChange: jest.fn(),
    onPageSizeChange: jest.fn(),
  };

  function renderComponent(totalPages: number) {
    renderConnectedContainer(
      <Pagination
        onPageChange={props.onPageChange}
        onPageSizeChange={props.onPageSizeChange}
        totalPages={totalPages}
      />,
      () => defaultState
    );
  }
  describe('Visible pages', () => {
    it.each([
      { totalPages: 4, expected: [' Previous', '1', '2', '3', '4', 'Next '] },
      { totalPages: 6, expected: [' Previous', '1', '2', '3', '4', '5', '6', 'Next '] },
      { totalPages: 7, expected: [' Previous', '1', '2', '3', '4', '5', '...7', 'Next '] },
    ])(
      'should show the pages according to the total of pages -> %o',
      ({ totalPages, expected }) => {
        renderComponent(totalPages);
        const pageNumbers = screen.getAllByRole('button').map(item => item.textContent);
        expect(pageNumbers).toMatchObject(expected);
        expect(screen.getByText('Previous').parentElement).toBeDisabled();
      }
    );
  });

  describe('Previous & Next', () => {
    beforeEach(() => {
      renderComponent(10);
    });

    it('should enable the Previous button if the active page is not 1', () => {
      fireEvent.click(screen.getByText('Next').parentElement!);
      expect(screen.getByText('Previous').parentElement).toBeEnabled();
      expect(screen.getByText('Next').parentElement).toBeEnabled();
    });

    it('should disable the Next button if the active page is the last one', () => {
      fireEvent.click(screen.getByText('...10'));
      fireEvent.click(screen.getByText('Next').parentElement!);
      expect(screen.getByText('Next').parentElement).toBeDisabled();
      expect(screen.getByText('Previous').parentElement).toBeEnabled();
      const pageNumbers = screen.getAllByRole('button').map(item => item.textContent);
      expect(pageNumbers).toMatchObject([' Previous', '1', '...7', '8', '9', '10', 'Next ']);
    });

    it('should enable both previous and next buttons for pages in the middle', () => {
      fireEvent.click(screen.getByText('...10'));
      fireEvent.click(screen.getByText('...7'));
      fireEvent.click(screen.getByText('Previous').parentElement!);
      expect(screen.getByText('Previous').parentElement).toBeEnabled();
      expect(screen.getByText('Next').parentElement).toBeEnabled();
      const pageNumbers = screen.getAllByRole('button').map(item => item.textContent);
      expect(pageNumbers).toMatchObject([' Previous', '1', '...5', '6', '7', '...10', 'Next ']);
    });

    it('should disable the previous button if the active page is the first one', () => {
      fireEvent.click(screen.getByText('2'));
      fireEvent.click(screen.getByText('Previous').parentElement!);
      expect(screen.getByText('Previous').parentElement).toBeDisabled();
      expect(screen.getByText('Next').parentElement).toBeEnabled();
    });
  });

  describe('Active page', () => {
    it.each([
      {
        targetNumber: 20,
        totalPages: 20,
        expected: [' Previous', '1', '...17', '18', '19', '20', 'Next '],
      },
      {
        targetNumber: 5,
        totalPages: 20,
        expected: [' Previous', '1', '...4', '5', '6', '...20', 'Next '],
      },
    ])(
      'should update visible pages according to the active page -> %o',
      ({ targetNumber, totalPages, expected }) => {
        renderComponent(totalPages);
        const numberLabel = targetNumber === totalPages ? `...${totalPages}` : targetNumber;
        fireEvent.click(screen.getByText(numberLabel));
        const pageNumbers = screen.getAllByRole('button').map(item => item.textContent);
        expect(pageNumbers).toMatchObject(expected);
        expect(props.onPageChange).toBeCalledWith(targetNumber - 1);
      }
    );
  });

  describe('when the page size changes', () => {
    it('should call the onPageSizeChange parameter', () => {
      renderComponent(3);
      fireEvent.change(screen.getByText('100 per page').parentElement!, { target: { value: 500 } });
      expect(props.onPageSizeChange).toBeCalledWith(500);
    });
  });
});
