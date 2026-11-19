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

const pendingApply = () => {
  let finish: () => void = () => undefined;
  const onApply = jest.fn(async () => {
    await new Promise<void>(resolve => {
      finish = () => resolve();
    });
  });
  return { onApply, finish: () => finish() };
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
    const pending = pendingApply();
    render(
      <LogoAdjustModal
        src="/logo.png"
        uploadName="uwazi-theme-logo-light.png"
        onClose={() => undefined}
        onApply={pending.onApply}
      />
    );
    loadSource();
    const apply = screen.getByRole('button', { name: 'Apply' });
    act(() => {
      apply.click();
      apply.click();
    });
    expect(pending.onApply).toHaveBeenCalledTimes(1);
    expect(pending.onApply).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'uwazi-theme-logo-light.png' }),
      expect.anything()
    );
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
    await act(async () => {
      pending.finish();
    });
    expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled();
  });
});
