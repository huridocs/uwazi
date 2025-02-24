/**
 * @jest-environment jsdom
 */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { render, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { TestAtomStoreProvider } from 'V2/testing';
import { localeAtom } from 'V2/atoms';
import { I18NLink } from '../I18NLinkV2';

describe('I18NLink', () => {
  let renderResult: RenderResult;
  let locale = 'fr';
  let to = '/about';
  let activeClassname = '';

  const renderComponent = () => {
    renderResult = render(
      <BrowserRouter basename="/">
        <TestAtomStoreProvider initialValues={[[localeAtom, locale]]}>
          <I18NLink to={to} activeClassname={activeClassname}>
            My link
          </I18NLink>
        </TestAtomStoreProvider>
      </BrowserRouter>
    );
  };

  it('renders a link with the locale prefixed', () => {
    renderComponent();
    const link = renderResult.getByText('My link');
    expect(link.getAttribute('href')).toBe('/fr/about');
  });

  it('renders a link without a locale if localeAtom is empty', () => {
    locale = '';
    to = '/contact';

    renderComponent();

    const link = renderResult.getByText('My link');
    expect(link.getAttribute('href')).toBe('/contact');
  });

  it('should apply active classname', () => {
    activeClassname = 'red';
    to = '/';

    renderComponent();

    const link = renderResult.getByText('My link');
    expect(link.getAttribute('class')).toBe(' red');
  });
});
