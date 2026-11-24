/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { userAtom } from '#V2/atoms/index.js';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { AskBertButton } from '../AskBertButton.js';

jest.mock('#app/V2/CustomHooks/useIsMobile.js', () => ({ useIsMobile: () => false }));

describe('AskBertButton', () => {
  it('uses the borderless header chip', () => {
    render(
      <TestAtomStoreProvider
        initialValues={[
          [userAtom, { _id: 'user-1' }],
          [settingsAtom, { features: { aiAssistant: true } }],
        ]}
      >
        <AskBertButton />
      </TestAtomStoreProvider>
    );
    expect(screen.getByRole('button', { name: 'Ask Bert' }).className).not.toContain('border');
  });
});
