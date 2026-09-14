/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { FileCard } from '../FileCard.js';
import { mockPdfFile } from './testHelpers.js';

describe('FileCard', () => {
  it('is a listitem with a select button and a sibling download link', () => {
    render(<FileCard file={mockPdfFile} index={0} onFileSelect={jest.fn()} />);
    const item = screen.getByRole('listitem');
    const select = screen.getByRole('button', { name: /Select Sample Document.pdf/ });
    const download = screen.getByRole('link', { name: 'Download Sample Document.pdf' });
    expect(item.contains(select)).toBe(true);
    expect(item.contains(download)).toBe(true);
    expect(select.contains(download)).toBe(false);
  });
});
