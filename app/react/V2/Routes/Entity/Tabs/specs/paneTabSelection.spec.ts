/**
 * @jest-environment jsdom
 */
import { MAIN_TAB, SIDE_TAB } from '../tabIds.js';
import {
  applyPaneChoice,
  resolvePaneTabs,
  searchHitPanes,
  selectPaneTab,
  type PaneTabAvailability,
} from '../paneTabSelection.js';

const availability: PaneTabAvailability = {
  hasMainDocument: true,
  showTranslationsTab: true,
  hasEntity: true,
};

const open = (left: string, right: string | null) =>
  resolvePaneTabs({ left, rightFromUrl: right, availability });

const strip = [
  SIDE_TAB.DOCUMENT,
  SIDE_TAB.METADATA,
  SIDE_TAB.RELATIONSHIPS,
  SIDE_TAB.FILES,
  SIDE_TAB.TOC,
  SIDE_TAB.SEARCH,
];

describe('paneTabSelection', () => {
  it('reads s=metadata from a hash that also carries page and searchTerm', () => {
    const hash = new URLSearchParams('s=metadata&page=1&searchTerm=Human');
    hash.delete('page');
    const next = resolvePaneTabs({
      left: null,
      rightFromUrl: hash.get('s'),
      availability,
    });

    expect(hash.get('searchTerm')).toBe('Human');
    expect(next.right).toBe(SIDE_TAB.METADATA);
    expect(next.rightChosen).toBe(true);
    expect(next.left).toBe(SIDE_TAB.DOCUMENT);
  });

  it('ignores a stored choice when the open tabs no longer match it', () => {
    const resolved = open(MAIN_TAB.DOCUMENT, SIDE_TAB.METADATA);
    const next = applyPaneChoice(resolved, {
      left: true,
      right: false,
      leftTab: SIDE_TAB.FILES,
      rightTab: SIDE_TAB.FILE,
    });

    expect(next.leftChosen).toBe(resolved.leftChosen);
    expect(next.rightChosen).toBe(resolved.rightChosen);
  });

  it('keeps a stored choice while the same tabs stay open', () => {
    const resolved = open(MAIN_TAB.DOCUMENT, SIDE_TAB.TOC);
    const next = applyPaneChoice(resolved, {
      left: true,
      right: false,
      leftTab: SIDE_TAB.DOCUMENT,
      rightTab: SIDE_TAB.TOC,
    });

    expect(next.leftChosen).toBe(true);
    expect(next.rightChosen).toBe(false);
  });

  it('does not mark a default right tab chosen when the hash no longer has it', () => {
    const resolved = open(MAIN_TAB.DOCUMENT, null);
    const next = applyPaneChoice(resolved, {
      left: true,
      right: true,
      leftTab: resolved.left,
      rightTab: resolved.right,
    });

    expect(next.rightChosen).toBe(false);
  });

  it('shows the same tabs on both sides until Files is the left tab', () => {
    const next = open(MAIN_TAB.DOCUMENT, SIDE_TAB.METADATA);

    expect(next.leftIds).toEqual(strip);
    expect(next.rightIds).toEqual(strip);
    expect(next.left).toBe(SIDE_TAB.DOCUMENT);
    expect(next.right).toBe(SIDE_TAB.METADATA);
  });

  it('shows File and Translations on the right only while Files is open on the left', () => {
    const next = open(MAIN_TAB.FILES, SIDE_TAB.FILE);

    expect(next.leftIds).toEqual(strip);
    expect(next.rightIds).toEqual([...strip, SIDE_TAB.FILE, SIDE_TAB.TRANSLATIONS]);
    expect(next.left).toBe(SIDE_TAB.FILES);
    expect(next.right).toBe(SIDE_TAB.FILE);
  });

  it('opens the correlated Document tab when ToC is activated and the other tab was not chosen', () => {
    const current = { ...open(MAIN_TAB.METADATA, SIDE_TAB.FILES), rightChosen: false };
    const next = selectPaneTab({ current, pane: 'left', tabId: SIDE_TAB.TOC, availability });

    expect(next.left).toBe(SIDE_TAB.TOC);
    expect(next.right).toBe(SIDE_TAB.DOCUMENT);
    expect(next.rightChosen).toBe(false);
  });

  it('keeps a tab the user already chose on the other side', () => {
    const current = open(MAIN_TAB.METADATA, SIDE_TAB.FILES);
    const next = selectPaneTab({ current, pane: 'left', tabId: SIDE_TAB.TOC, availability });

    expect(next.left).toBe(SIDE_TAB.TOC);
    expect(next.right).toBe(SIDE_TAB.FILES);
  });
});

describe('paneTabSelection partners', () => {
  it('opens the correlated tab when the other side is showing the tab just picked', () => {
    const current = open(MAIN_TAB.DOCUMENT, SIDE_TAB.METADATA);
    const next = selectPaneTab({ current, pane: 'right', tabId: SIDE_TAB.DOCUMENT, availability });

    expect(next.right).toBe(SIDE_TAB.DOCUMENT);
    expect(next.left).toBe(SIDE_TAB.METADATA);
  });

  it('opens File on the right when Files is activated and the right tab was not chosen', () => {
    const current = open(MAIN_TAB.DOCUMENT, null);
    const next = selectPaneTab({ current, pane: 'left', tabId: SIDE_TAB.FILES, availability });

    expect(current.rightChosen).toBe(false);
    expect(next.left).toBe(SIDE_TAB.FILES);
    expect(next.right).toBe(SIDE_TAB.FILE);
  });

  it('keeps the other pane when it shows a different tab', () => {
    const current = open(MAIN_TAB.DOCUMENT, SIDE_TAB.METADATA);
    const next = selectPaneTab({
      current,
      pane: 'left',
      tabId: SIDE_TAB.RELATIONSHIPS,
      availability,
    });

    expect(next.left).toBe(SIDE_TAB.RELATIONSHIPS);
    expect(next.right).toBe(SIDE_TAB.METADATA);
  });

  it('selects Files on the other pane when File is opened', () => {
    const current = open(MAIN_TAB.METADATA, SIDE_TAB.DOCUMENT);
    const next = selectPaneTab({ current, pane: 'right', tabId: SIDE_TAB.FILE, availability });

    expect(next.right).toBe(SIDE_TAB.FILE);
    expect(next.left).toBe(SIDE_TAB.FILES);
  });

  it('omits document and toc when there is no main file', () => {
    const next = resolvePaneTabs({
      left: MAIN_TAB.METADATA,
      rightFromUrl: SIDE_TAB.DOCUMENT,
      availability: { hasMainDocument: false, showTranslationsTab: false, hasEntity: true },
    });

    expect(next.leftIds).not.toContain(SIDE_TAB.DOCUMENT);
    expect(next.leftIds).not.toContain(SIDE_TAB.TOC);
    expect(next.right).not.toBe(SIDE_TAB.DOCUMENT);
    expect(next.leftIds).toEqual([
      SIDE_TAB.METADATA,
      SIDE_TAB.RELATIONSHIPS,
      SIDE_TAB.FILES,
      SIDE_TAB.SEARCH,
    ]);
    expect(next.rightIds).not.toContain(SIDE_TAB.FILE);
    expect(next.rightIds).not.toContain(SIDE_TAB.TRANSLATIONS);
    const partner = resolvePaneTabs({
      left: MAIN_TAB.METADATA,
      rightFromUrl: null,
      availability: { hasMainDocument: false, showTranslationsTab: false, hasEntity: true },
    });
    expect(partner.right).toBe(SIDE_TAB.SEARCH);
  });

  it('opens the correlated partner when a link sets only one side', () => {
    expect(open(MAIN_TAB.DOCUMENT, null)).toMatchObject({
      left: SIDE_TAB.DOCUMENT,
      right: SIDE_TAB.METADATA,
      rightChosen: false,
    });
    expect(open(MAIN_TAB.METADATA, null)).toMatchObject({
      left: SIDE_TAB.METADATA,
      right: SIDE_TAB.DOCUMENT,
      rightChosen: false,
    });
    expect(open(MAIN_TAB.FILES, null)).toMatchObject({
      left: SIDE_TAB.FILES,
      right: SIDE_TAB.FILE,
      rightChosen: false,
    });
    expect(open(MAIN_TAB.RELATIONSHIPS, null).right).toBe(SIDE_TAB.METADATA);
    expect(open('', SIDE_TAB.DOCUMENT)).toMatchObject({
      left: SIDE_TAB.METADATA,
      right: SIDE_TAB.DOCUMENT,
      leftChosen: false,
      rightChosen: true,
    });
    expect(open('', SIDE_TAB.FILE)).toMatchObject({
      left: SIDE_TAB.FILES,
      right: SIDE_TAB.FILE,
      leftChosen: false,
      rightChosen: true,
    });
    expect(open('', SIDE_TAB.TRANSLATIONS).left).toBe(SIDE_TAB.FILES);
  });

  it('moves File requested on the left onto the right and opens Files on the left', () => {
    const next = open(SIDE_TAB.FILE, null);

    expect(next.left).toBe(SIDE_TAB.FILES);
    expect(next.right).toBe(SIDE_TAB.FILE);
  });

  it('leaves File when the left pane leaves Files', () => {
    const current = open(MAIN_TAB.FILES, SIDE_TAB.FILE);
    const next = selectPaneTab({ current, pane: 'left', tabId: SIDE_TAB.METADATA, availability });

    expect(next.left).toBe(SIDE_TAB.METADATA);
    expect(next.rightIds).not.toContain(SIDE_TAB.FILE);
    expect(next.right).toBe(SIDE_TAB.DOCUMENT);
  });

  it('opens a search hit on the right and keeps Search on the left', () => {
    const next = searchHitPanes(MAIN_TAB.DOCUMENT, true, availability);

    expect(next).toMatchObject({
      left: SIDE_TAB.SEARCH,
      right: SIDE_TAB.DOCUMENT,
      leftChosen: true,
      rightChosen: true,
    });
  });

  it('opens a search hit on the left and pins Search on the right', () => {
    const next = searchHitPanes(MAIN_TAB.METADATA, false, availability);

    expect(next).toMatchObject({
      left: SIDE_TAB.METADATA,
      right: SIDE_TAB.SEARCH,
      leftChosen: true,
      rightChosen: true,
    });
  });
});
