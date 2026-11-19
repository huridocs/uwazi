/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { LogoAdjustModal } from '../LogoAdjustModal.js';

const loadSource = () => {
  const image = document.querySelector('img');
  if (!image) throw new Error('missing image');
  Object.defineProperty(image, 'naturalWidth', { value: 80 });
  Object.defineProperty(image, 'naturalHeight', { value: 40 });
  act(() => {
    image.dispatchEvent(new Event('load'));
  });
};

describe('LogoAdjustModal', () => {
  beforeEach(() => {
    const getContext: HTMLCanvasElement['getContext'] = () => null;
    HTMLCanvasElement.prototype.getContext = getContext;
    HTMLCanvasElement.prototype.toBlob = callback => {
      callback(new Blob(['png'], { type: 'image/png' }));
    };
    HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,xx';
  });

  it('keeps Apply disabled until the upload finishes', async () => {
    let finish: () => void = () => undefined;
    let calls = 0;
    render(
      <LogoAdjustModal
        src="/logo.png"
        onClose={() => undefined}
        onApply={async () => {
          calls += 1;
          await new Promise<void>(resolve => {
            finish = () => resolve();
          });
        }}
      />
    );
    loadSource();
    const apply = screen.getByRole('button', { name: 'Apply' });
    act(() => {
      apply.click();
      apply.click();
    });
    expect(calls).toBe(1);
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
    await act(async () => {
      finish();
    });
    expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled();
  });
});
