/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { FileDetailsField } from '../FileDetailsField.js';

describe('FileDetailsField', () => {
  it('uses the design record label: 11px semibold, not the 10px nano scale', () => {
    render(
      <FileDetailsField label="Name">
        <span>sample-1.pdf</span>
      </FileDetailsField>
    );

    const label = screen.getByText('Name');
    expect(label.className).toContain('text-meta');
    expect(label.className).toContain('font-semibold');
    expect(label.className).toContain('leading-normal');
    expect(label.className).not.toContain('text-nano');
  });
});
