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

    it('should allow accepting a suggestion and discard', async () => {
      expect(await nightmare.isVisible(selectors.review.discardButtonDisabled)).toBe(true);
      await nightmare.waitToClick(selectors.review.firstSuggestion);
      expect(await nightmare.isVisible(selectors.review.firstMultiSelectItemSelected)).toBe(true);
      await nightmare
        .waitToClick(selectors.review.firstSuggestReject)
        .waitToBeGone(selectors.review.firstSuggestion);
      await nightmare.waitToClick(selectors.review.secondMultiSelectItem);
      expect(await nightmare.isVisible(selectors.review.secondMultiSelectItemSelected)).toBe(true);
      expect(await nightmare.isVisible(selectors.review.discardButtonEnabled)).toBe(true);
      await nightmare.waitToClick(selectors.review.discardButtonEnabled);
    });

    it('should allow accepting a suggestion and save', async () => {
      expect(
        await nightmare
          .waitToBeGone(selectors.review.discardButtonEnabled)
          .isVisible(selectors.review.discardButtonDisabled)
      ).toBe(true);
      await nightmare.waitToClick(selectors.review.firstSuggestion);
      expect(await nightmare.isVisible(selectors.review.firstMultiSelectItemSelected)).toBe(true);
      expect(await nightmare.isVisible(selectors.review.saveAndGoToNextEnabled)).toBe(true);
      await nightmare
        .waitToClick(selectors.review.saveAndGoToNextEnabled)
        .waitToBeGone(selectors.review.discardButtonEnabled);
      expect(await nightmare.isVisible(selectors.review.discardButtonDisabled)).toBe(true);
    });
  });
});
