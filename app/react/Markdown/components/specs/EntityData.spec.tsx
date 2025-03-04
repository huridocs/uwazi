/**
 * @jest-environment jsdom
 */
import React, { act } from 'react';
import { screen, RenderResult } from '@testing-library/react';
import { renderConnectedContainer } from 'app/utils/test/renderConnected';
import { TestAtomStoreProvider } from 'V2/testing';
import { localeAtom, translationsAtom } from 'V2/atoms';
import { state, translations } from './fixture/state';
import { EntityData, EntityDataProps } from '../EntityData';

describe('EntityData Markdown', () => {
  let consoleErrorSpy: jasmine.Spy;
  let renderResult: RenderResult;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jasmine.createSpy('consoleErrorSpy');
    spyOn(console, 'error').and.callFake(consoleErrorSpy);
    global.fetch = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const render = async (props: EntityDataProps) => {
    await act(async () => {
      ({ renderResult } = renderConnectedContainer(
        <TestAtomStoreProvider
          initialValues={[
            [translationsAtom, translations],
            [localeAtom, 'en'],
          ]}
        >
          <EntityData {...props} />
        </TestAtomStoreProvider>,
        () => state
      ));
    });
  };

  describe('root properties Values', () => {
    it('should print title and root dates from root of entity', async () => {
      await render({ 'value-of': 'title' });
      expect(screen.getByText('Entity 1')).toBeInTheDocument();

      await render({ 'value-of': 'creationDate' });
      expect(screen.getByText('1234')).toBeInTheDocument();
    });
  });

  describe('metadata property Values', () => {
    it('should print formatted metadata properties (sanitizing names)', async () => {
      await render({ 'value-of': 'description' });
      expect(screen.getByText('A long description')).toBeInTheDocument();

      await render({ 'value-of': 'date' });
      expect(screen.getByText('Jul 13, 1977')).toBeInTheDocument();

      await render({ 'value-of': 'Main Image' });
      expect(screen.getByRole('img').getAttribute('src')).toBe('https://www.google.com');
    });
  });

  describe('labels (property names)', () => {
    it('should print translated labels (sanitizing names)', async () => {
      await render({ 'label-of': 'title' });
      expect(screen.getByText('Title translated')).toBeInTheDocument();

      await render({ 'label-of': 'Main Image' });
      expect(screen.getByText('Main Image translated')).toBeInTheDocument();
    });
  });

  describe('Error handling (until upstream implementation is implemented)', () => {
    it('should fail if no value or propertyName is provided', async () => {
      await render({});
      //get the body
      expect(renderResult.container.innerHTML).toBe('');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error on EntityData: ');
      expect(consoleErrorSpy.calls.all()[2].args[0].message).toBe(
        '"value-of" or "label-of" must be provided.'
      );
    });

    it('should fail if both value and propertyName are provided', async () => {
      await render({ 'value-of': 'something', 'label-of': 'something else' });
      //assert empty html
      expect(renderResult.container.innerHTML).toBe('');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error on EntityData: ');
      expect(consoleErrorSpy.calls.all()[2].args[0].message).toBe(
        'Can\'t provide both "value-of" and "label-of".'
      );
    });
  });
});
