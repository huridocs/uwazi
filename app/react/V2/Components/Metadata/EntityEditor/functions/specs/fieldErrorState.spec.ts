/**
 * @jest-environment jsdom
 */
import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { getFieldErrorState } from '../fieldErrorState.js';

describe('getFieldErrorState', () => {
  it('returns no error state when field has no error', () => {
    expect(getFieldErrorState({})).toEqual({ showError: false, message: undefined });
  });

  it('returns showError and message for required errors', () => {
    const state = getFieldErrorState({ error: { type: 'required', message: '' } });
    expect(state.showError).toBe(true);
    expect(state.message).toBeTruthy();
  });

  it('returns showError and custom message for validate errors', () => {
    const state = getFieldErrorState({ error: { type: 'validate', message: 'Invalid range' } });
    expect(state.showError).toBe(true);
    expect(state.message).toEqual(React.createElement(Translate, null, 'Invalid range'));
  });
});
