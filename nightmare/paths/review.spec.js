/**
 * /*eslint max-nested-callbacks: ["error", 10]
 *
 * @format
 */

import { catchErrors } from 'api/utils/jasmineHelpers';
import selectors from '../helpers/selectors.js';
import createNightmare from '../helpers/nightmare';
import insertFixtures from '../helpers/insertFixtures';
import { loginAsAdminAndGoToSettings } from '../helpers/commonTests.js';
import config from '../helpers/config';

const nightmare = createNightmare();

describe('review path', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  describe('login', () => {
    it('should log in as admin then click the settings nav button', done => {
      loginAsAdminAndGoToSettings(nightmare, catchErrors, done);
    });
  });

  describe('OneUpReview tests', () => {
    it('should navigate to review and allow switching on and off full edit', async () => {
      const url = `${config.url}/review?q=(filters:(_super_powers:(values:!(any))))`;
      expect(await nightmare.goto(url).url()).toEqual(url);
      expect(await nightmare.isVisible(selectors.review.templateIcon)).toBe(true);
      await nightmare
        .waitToClick(selectors.review.toggleFullEditButton)
        .waitToClick(selectors.review.toggleFullEditButton)
        .waitToClick(selectors.review.toggleFullEditButton)
        .waitToClick(selectors.review.toggleFullEditButton)
        .waitToClick(selectors.review.toggleFullEditButton);
      expect(await nightmare.isVisible(selectors.review.titleEditBox)).toBe(true);
    });

    it('should navigate to review and allow accepting a suggestion', async () => {
      const url = `${config.url}/review?q=(filters:(_super_powers:(values:!(any))))`;
      expect(await nightmare.goto(url).url()).toEqual(url);
      expect(await nightmare.isVisible(selectors.review.firstSuggestion)).toBe(true);
      await nightmare.waitToClick(selectors.review.firstSuggestion);
    });
  });
});
