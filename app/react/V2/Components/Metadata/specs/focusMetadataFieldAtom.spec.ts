/**
 * @jest-environment jsdom
 */
/* eslint-disable max-statements */
import {
  applyMetadataFieldFocus,
  esFieldToFocusKey,
  FLASH_MS,
} from '../focusMetadataFieldAtom.js';

describe('esFieldToFocusKey', () => {
  it('maps title fields to title', () => {
    expect(esFieldToFocusKey('title')).toBe('title');
    expect(esFieldToFocusKey('title.value')).toBe('title');
  });

  it('strips metadata. prefix and .value/.label suffix to property name', () => {
    expect(esFieldToFocusKey('metadata.description.value')).toBe('description');
    expect(esFieldToFocusKey('metadata.thesaurus_property.label')).toBe('thesaurus_property');
    expect(esFieldToFocusKey('metadata.summary')).toBe('summary');
  });
});

describe('applyMetadataFieldFocus', () => {
  let scrollIntoView: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    scrollIntoView = jest.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: scrollIntoView,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('scrolls instantly and flashes a matching data-field-key target', () => {
    const root = document.createElement('div');
    const target = document.createElement('div');
    target.setAttribute('data-field-key', 'description');
    root.appendChild(target);
    document.body.appendChild(root);

    const cleanup = applyMetadataFieldFocus(() => root, 'description');
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'center',
    });
    expect(target.classList.contains('flash-highlight')).toBe(true);

    jest.advanceTimersByTime(FLASH_MS);
    expect(target.classList.contains('flash-highlight')).toBe(false);

    cleanup();
    root.remove();
  });

  it('re-scrolls while deadline runs (layout settle)', () => {
    const root = document.createElement('div');
    const target = document.createElement('div');
    target.setAttribute('data-field-key', 'text');
    root.appendChild(target);
    document.body.appendChild(root);

    applyMetadataFieldFocus(() => root, 'text');
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(500);
    expect(scrollIntoView.mock.calls.length).toBeGreaterThanOrEqual(6);

    root.remove();
  });

  it('retries until the field appears under root', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);

    applyMetadataFieldFocus(() => root, 'late');
    expect(scrollIntoView).not.toHaveBeenCalled();

    const target = document.createElement('div');
    target.setAttribute('data-field-key', 'late');
    root.appendChild(target);

    jest.advanceTimersByTime(100);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'center',
    });
    expect(target.classList.contains('flash-highlight')).toBe(true);

    root.remove();
  });

  it('clears retry timers on cleanup', () => {
    const root = document.createElement('div');
    const target = document.createElement('div');
    target.setAttribute('data-field-key', 'text');
    root.appendChild(target);
    document.body.appendChild(root);

    const cleanup = applyMetadataFieldFocus(() => root, 'text');
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    cleanup();
    scrollIntoView.mockClear();
    jest.advanceTimersByTime(500);
    expect(scrollIntoView).not.toHaveBeenCalled();

    root.remove();
  });
});
