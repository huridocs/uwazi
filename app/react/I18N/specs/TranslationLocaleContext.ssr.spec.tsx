/**
 * @jest-environment node
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  getTranslationLocaleOverride,
  TranslationLocaleProvider,
} from '../TranslationLocaleContext.js';

describe('TranslationLocaleProvider SSR', () => {
  it('does not leave renderLocaleOverride after SSR render', () => {
    expect(getTranslationLocaleOverride()).toBeNull();
    renderToString(
      <TranslationLocaleProvider locale="es">
        <span>child</span>
      </TranslationLocaleProvider>
    );
    expect(getTranslationLocaleOverride()).toBeNull();
  });
});
