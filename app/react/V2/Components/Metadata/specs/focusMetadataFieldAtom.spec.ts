/**
 * @jest-environment jsdom
 */
import { scrollIntoView } from '#V2/helpers/scrollIntoView.js';
import {
  applyMetadataFieldFocus,
  esFieldToFocusKey,
  FLASH_MS,
} from '../focusMetadataFieldAtom.js';

jest.mock('#V2/helpers/scrollIntoView.js', () => ({
  scrollIntoView: jest.fn(),
}));

const mockedScrollIntoView = jest.mocked(scrollIntoView);

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
  beforeEach(() => {
    jest.useFakeTimers();
    mockedScrollIntoView.mockClear();
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
    expect(mockedScrollIntoView).toHaveBeenCalledWith(target, {
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
    expect(mockedScrollIntoView).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    expect(mockedScrollIntoView).toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(500);
    expect(mockedScrollIntoView.mock.calls.length).toBeGreaterThanOrEqual(6);

    root.remove();
  });

  it('retries until the field appears under root', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);

    applyMetadataFieldFocus(() => root, 'late');
    expect(mockedScrollIntoView).not.toHaveBeenCalled();

    const target = document.createElement('div');
    target.setAttribute('data-field-key', 'late');
    root.appendChild(target);

    jest.advanceTimersByTime(100);
    expect(mockedScrollIntoView).toHaveBeenCalledWith(target, {
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
    expect(mockedScrollIntoView).toHaveBeenCalledTimes(1);

    cleanup();
    mockedScrollIntoView.mockClear();
    jest.advanceTimersByTime(500);
    expect(mockedScrollIntoView).not.toHaveBeenCalled();

    root.remove();
  });
});
