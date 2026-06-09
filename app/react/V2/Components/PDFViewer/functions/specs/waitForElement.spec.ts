/**
 * @jest-environment jsdom
 */

import { waitForElement } from '../waitForElement.js';

describe('waitForElement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('resolves immediately when element is already in the DOM', async () => {
    const el = document.createElement('div');
    el.id = 'immediate';
    document.body.appendChild(el);

    const found = await waitForElement('#immediate');
    expect(found).toBe(el);
  });

  it('waits for element added later via mutations', async () => {
    const promise = waitForElement('.delayed');

    setTimeout(() => {
      const d = document.createElement('div');
      d.className = 'delayed';
      document.body.appendChild(d);
    }, 10);

    const found = await promise;
    expect(found).toBeInstanceOf(Element);
    expect(found.className).toBe('delayed');
  });

  it('rejects after the provided timeout', async () => {
    await expect(waitForElement('.never', 50)).rejects.toBeUndefined();
  });
});
