/* eslint max-nested-callbacks: ["error", 10] */

import selectors from '../helpers/selectors.js';
import createNightmare from '../helpers/nightmare';
import insertFixtures from '../helpers/insertFixtures';

const nightmare = createNightmare();

describe('review path', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  describe('MultiEditLabel tests', () => {
    it('should navigate to multiedit', async () => {
      await nightmare
        .login('admin', 'admin')
        .waitToClick(selectors.navigation.settingsNavButton)
        .waitToClick(selectors.settingsView.dictionariesButton)
        .waitToClick(selectors.settingsView.dictionariesViewSuggestionsButton)
        .waitToClick(selectors.settingsView.dictionariesLabelDocumentsButton)
        .wait(selectors.libraryView.libraryFirstDocument);
      expect(await nightmare.isVisible(selectors.libraryView.libraryFirstDocument)).toBe(true);
    });
    // http://localhost:3000/en/library/?multiEditThesaurus=58ad7d240d44252fee4e6208&q=(allAggregations:!t,filters:(),includeUnpublished:!t,limit:30,order:desc,sort:creationDate,types:!(%2758ad7d240d44252fee4e61fb%27),unpublished:!f)
    it('should not save without autosave', async () => {
      await nightmare
        .waitToClick(selectors.libraryView.superVillianType)
        .waitToClick(selectors.libraryView.libraryFirstDocument)
        .shiftClick(selectors.libraryView.librarySecondDocument)
        .waitToClick(selectors.multiEditLabel.autoSaveToggleOn);
      expect(await nightmare.isVisible(selectors.multiEditLabel.autoSaveToggleOff)).toBe(true);
      expect(await nightmare.isVisible(selectors.multiEditLabel.firstCheckboxPartial)).toBe(true);
      expect(
        await nightmare
          .waitToClick(selectors.multiEditLabel.firstCheckboxPartial)
          .waitToClick(selectors.multiEditLabel.firstCheckboxOn)
          .waitToClick(selectors.multiEditLabel.firstCheckboxOff)
          .isVisible(selectors.multiEditLabel.firstCheckboxPartial)
      ).toBe(true);
      expect(await nightmare.isVisible(selectors.multiEditLabel.firstCheckboxPartial)).toBe(true);
      await nightmare
        .waitToClick(selectors.multiEditLabel.firstCheckboxPartial)
        .waitToClick(selectors.multiEditLabel.discardButton);
      expect(await nightmare.isVisible(selectors.multiEditLabel.firstCheckboxPartial)).toBe(true);
      await nightmare
        .waitToClick(selectors.multiEditLabel.firstCheckboxPartial)
        .waitToClick(selectors.libraryView.libraryFirstDocument)
        .wait(selectors.multiEditLabel.firstCheckboxOff);
      expect(await nightmare.isVisible(selectors.multiEditLabel.firstCheckboxOff)).toBe(true);
    });
    it('should save with autosave', async () => {
      await nightmare
        .waitToClick(selectors.libraryView.libraryFirstDocument)
        .shiftClick(selectors.libraryView.librarySecondDocument)
        .waitToClick(selectors.multiEditLabel.autoSaveToggleOff);
      expect(await nightmare.isVisible(selectors.multiEditLabel.autoSaveToggleOn)).toBe(true);
      expect(await nightmare.isVisible(selectors.multiEditLabel.firstCheckboxPartial)).toBe(true);
      await nightmare
        .waitToClick(selectors.multiEditLabel.firstCheckboxPartial)
        .waitToClick(selectors.libraryView.libraryFirstDocument);
      expect(await nightmare.isVisible(selectors.multiEditLabel.firstCheckboxOn)).toBe(true);
    });
  });
});
