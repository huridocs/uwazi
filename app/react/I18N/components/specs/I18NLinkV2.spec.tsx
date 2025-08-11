/**
 * @jest-environment jsdom
 */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TestAtomStoreProvider, TestRouterContext } from 'V2/testing';
import { localeAtom } from 'V2/atoms';
import { I18NLink, I18NLinkProps } from '../../I18NLinkV2';

describe('I18NLinkV2', () => {
  const defaultProps: I18NLinkProps & { locale: string; location: string } = {
    to: '/test',
    activeClassname: 'is-active',
    className: 'base-class',
    locale: 'en',
    location: '/',
  };

  let testProps = { ...defaultProps };

  beforeEach(() => {
    testProps = { ...defaultProps };
  });

  const renderComponent = () => {
    const { locale, location, ...props } = testProps;
    render(
      <TestRouterContext initialEntries={[location]}>
        <TestAtomStoreProvider initialValues={[[localeAtom, locale]]}>
          <I18NLink {...props}>My link</I18NLink>
        </TestAtomStoreProvider>
      </TestRouterContext>
    );
  };

  it('should render a link', async () => {
    renderComponent();
    const link = await screen.findByText('My link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass('base-class ');
    expect(link).not.toHaveClass('is-active');
    expect(link).toHaveAttribute('href', '/en/test');
  });

  it('should return a link without locale', async () => {
    testProps.localized = false;
    renderComponent();
    const link = await screen.findByText('My link');
    expect(link).toHaveAttribute('href', '/test');
  });

  it('should have the active classname', async () => {
    testProps.to = '/';
    testProps.localized = false;
    renderComponent();
    const link = await screen.findByText('My link');
    expect(link).toHaveClass('base-class is-active');
  });
});
