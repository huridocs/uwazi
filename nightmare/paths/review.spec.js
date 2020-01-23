/** @format */

/* eslint max-nested-callbacks: ["error", 10] */

import selectors from '../helpers/selectors.js';
import createNightmare from '../helpers/nightmare';
import insertFixtures from '../helpers/insertFixtures';

const nightmare = createNightmare();

describe('review path', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  describe('OneUpReview tests', () => {
    it('should navigate to review', async () => {
      await nightmare
        .login('admin', 'admin')
        .waitToClick(selectors.navigation.settingsNavButton)
        .waitToClick(selectors.settingsView.dictionariesButton)
        .waitToClick(selectors.settingsView.dictionariesViewSuggestionsButton)
        .waitToClick(selectors.settingsView.dictionariesReviewSuggestionsButton)
        .wait(selectors.review.documentCount);
      expect(await nightmare.isVisible(selectors.review.documentCount)).toBe(true);
    });

    it('should allow switching on and off full edit', async () => {
      await nightmare
        .waitToClick(selectors.review.toggleFullEditButton)
        .waitToClick(selectors.review.toggleFullEditButton)
        .waitToClick(selectors.review.toggleFullEditButton)
        .waitToClick(selectors.review.toggleFullEditButton)
        .waitToClick(selectors.review.toggleFullEditButton);
      expect(await nightmare.isVisible(selectors.review.titleEditBox)).toBe(true);
    });

    it('should allow accepting a suggestion', async () => {
      await nightmare.waitToClick(selectors.review.firstSuggestion).wait(100);
      await nightmare.waitToClick(selectors.review.firstSuggestReject).wait(100);
      await nightmare.waitToClick(selectors.review.secondMultiSelectItem).wait(100);
      await nightmare
        .waitToClick(selectors.review.discardButton)
        .wait(selectors.review.disabledDiscardButton);
      await nightmare.waitToClick(selectors.review.firstSuggestion).wait(100);
      await nightmare.waitToClick(selectors.review.firstSuggestReject).wait(100);
      await nightmare.waitToClick(selectors.review.secondMultiSelectItem).wait(100);
      await nightmare
        .waitToClick(selectors.review.saveAndGoToNext)
        .wait(selectors.review.disabledDiscardButton);
    });
  });
});
