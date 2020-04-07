/* eslint max-nested-callbacks: ["error", 10] */

import selectors from '../helpers/selectors.js';
import createNightmare from '../helpers/nightmare';
import insertFixtures from '../helpers/insertFixtures';

const nightmare = createNightmare();

describe('review path', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  describe('QuickLabel tests', () => {
    it('should navigate to quicklabel', async () => {
      await nightmare
        .login('admin', 'admin')
        .waitToClick(selectors.navigation.settingsNavButton)
        .waitToClick(selectors.settingsView.dictionariesButton)
        .waitToClick(selectors.settingsView.dictionariesViewSuggestionsButton)
        .waitToClick(selectors.settingsView.dictionariesLabelDocumentsButton)
        .wait(selectors.libraryView.libraryFirstDocument);
      expect(await nightmare.isVisible(selectors.libraryView.libraryFirstDocument)).toBe(true);
    });

    it('should not save without autosave', async () => {
      await nightmare
        .waitToClick(selectors.libraryView.superVillianType)
        .waitToClick(selectors.libraryView.libraryFirstDocument)
        .shiftClick(selectors.libraryView.librarySecondDocument);
      expect(await nightmare.isVisible(selectors.quickLabel.autoSaveToggleOff)).toBe(true);
      expect(await nightmare.isVisible(selectors.quickLabel.firstCheckboxPartial)).toBe(true);
      expect(
        await nightmare
          .waitToClick(selectors.quickLabel.firstCheckboxPartial)
          .waitToClick(selectors.quickLabel.firstCheckboxOn)
          .waitToClick(selectors.quickLabel.firstCheckboxOff)
          .isVisible(selectors.quickLabel.firstCheckboxPartial)
      ).toBe(true);
      expect(await nightmare.isVisible(selectors.quickLabel.firstCheckboxPartial)).toBe(true);
      await nightmare
        .waitToClick(selectors.quickLabel.firstCheckboxPartial)
        .waitToClick(selectors.quickLabel.discardButton);
      expect(await nightmare.isVisible(selectors.quickLabel.firstCheckboxPartial)).toBe(true);
      await nightmare
        .waitToClick(selectors.quickLabel.firstCheckboxPartial)
        .waitToClick(selectors.libraryView.libraryFirstDocument)
        .wait(selectors.quickLabel.firstCheckboxOff);
      expect(await nightmare.isVisible(selectors.quickLabel.firstCheckboxOff)).toBe(true);
    });
    it('should save with autosave', async () => {
      await nightmare
        .waitToClick(selectors.libraryView.libraryFirstDocument)
        .shiftClick(selectors.libraryView.librarySecondDocument)
        .waitToClick(selectors.quickLabel.autoSaveToggleOff);
      expect(await nightmare.isVisible(selectors.quickLabel.autoSaveToggleOn)).toBe(true);
      expect(await nightmare.isVisible(selectors.quickLabel.firstCheckboxPartial)).toBe(true);
      await nightmare
        .waitToClick(selectors.quickLabel.firstCheckboxPartial)
        .waitToClick(selectors.libraryView.libraryFirstDocument);
      expect(await nightmare.isVisible(selectors.quickLabel.firstCheckboxOn)).toBe(true);
    });
  });
});
