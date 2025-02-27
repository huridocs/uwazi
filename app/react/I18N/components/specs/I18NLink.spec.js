/**
 * @jest-environment jsdom
 */
/* eslint-disable max-statements */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { I18NLink } from '../I18NLink';

describe('I18NLink', () => {
  let props;
  const clickAction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    props = {
      locale: 'es',
      to: '/page/1#section1',
      onClick: clickAction,
      dispatch: jest.fn(),
    };
  });

  const renderComponent = (initialEntries = ['/']) => {
    render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/" element={<I18NLink {...props}>Section 1</I18NLink>} />
          <Route
            path="/page/1"
            element={
              <div>
                <I18NLink {...props}>Section 1</I18NLink>
                <p id="section0">Something to forget</p>
                <p id="section1">Something to remember</p>
              </div>
            }
          />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('render', () => {
    it('should trigger onClick', () => {
      renderComponent();
      const link = screen.getByText('Section 1');
      fireEvent.click(link);
      expect(clickAction).toHaveBeenCalled();
      expect(link).toHaveAttribute('href', props.to);
    });

    it('should navigate when clicked', () => {
      renderComponent();
      const link = screen.getByRole('link');
      fireEvent.click(link);
      expect(screen.getByText('Something to remember')).toBeInTheDocument();
    });

    it('should scroll to the hash element', () => {
      renderComponent(['/page/1']);
      const link = screen.getByRole('link');
      const section = screen.getByText('Something to remember');
      section.scrollIntoView = jest.fn();

      jest.useFakeTimers();
      fireEvent.click(link);
      jest.runAllTimers();

      expect(section.scrollIntoView).toHaveBeenCalled();
    });
  });

  describe('when its disabled', () => {
    it('should not trigger onClick', () => {
      props.disabled = true;
      renderComponent();
      const link = screen.getByText('Section 1');
      fireEvent.click(link);
      expect(clickAction).not.toHaveBeenCalled();
    });

    it('should not navigate when clicked', () => {
      props.disabled = true;
      renderComponent();
      const link = screen.getByRole('link');
      fireEvent.click(link);
      expect(screen.queryByText('Something to remember')).not.toBeInTheDocument();
    });
  });
});
