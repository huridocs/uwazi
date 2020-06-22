/**
 * /*eslint max-nested-callbacks: ["error", 10]
 *
 * @format
 */

import { catchErrors } from 'api/utils/jasmineHelpers';
import selectors from '../helpers/selectors.js';
import createNightmare from '../helpers/nightmare';
import insertFixtures from '../helpers/insertFixtures';
import { loginAsAdminAndGoToUploads } from '../helpers/commonTests.js';

const nightmare = createNightmare();

describe('publish entity path', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  describe('login', () => {
    it('should log in as admin then click the uploads nav button', done => {
      loginAsAdminAndGoToUploads(nightmare, catchErrors, done);
    });
  });

  it('should create a new entity and publish it', done => {
    nightmare
      .click(selectors.uploadsView.newEntityButtom)
      .write(selectors.newEntity.form.title, 'scarecrow')
      .select(selectors.newEntity.form.type, '58f0aed2e147e720856a0741')
      .write(selectors.newEntity.form.realName, '?')
      .write(selectors.newEntity.form.age, '40')
      .waitToClick(selectors.newEntity.form.knownAccomplices.joker)
      .select(selectors.newEntity.form.mainSuperpower, 'b3eac310-8e9e-4adf-bd4c-13ed9f5765cb')
      .waitToClick(selectors.newEntity.form.suporPowers.moreButton)
      .waitToClick(selectors.newEntity.form.suporPowers.fly)
      .wait(selectors.newEntity.form.suporPowers.laserBeam)
      .waitToClick(selectors.newEntity.form.suporPowers.laserBeam)
      .pickToday(selectors.newEntity.form.firstSighting)
      .click(selectors.uploadsView.saveButton)
      .waitToClick(selectors.uploadsView.publishButton)
      .waitToClick(selectors.uploadsView.acceptPublishModel)
      .wait('.alert.alert-success')
      .isVisible('.alert.alert-success')
      .then(result => {
        expect(result).toBe(true);
        return nightmare.waitToClick('.alert.alert-success');
      })
      .then(done);
  });

  it('should go to library and check the values', done => {
    nightmare
      .waitForTheEntityToBeIndexed()
      .waitToClick(selectors.navigation.libraryNavButton)
      .waitToClick(selectors.libraryView.libraryFirstDocument)
      .wait(selectors.newEntity.viewer.title)
      .getInnerText(selectors.newEntity.viewer.title)
      .then(text => {
        expect(text).toBe('scarecrow');
        return nightmare.getInnerText(selectors.newEntity.viewer.realName);
      })
      .then(text => {
        expect(text).toBe('?');
        return nightmare.getInnerText(selectors.newEntity.viewer.knownAccomplices);
      })
      .then(text => {
        expect(text).toBe('Joker');
        return nightmare.getInnerText(selectors.newEntity.viewer.mainSuperpower);
      })
      .then(text => {
        expect(text).toBe('fly');
        return nightmare.getInnerText(selectors.newEntity.viewer.superpowers);
      })
      .then(text => {
        expect(text).toBe('fly\nlaser beam\n');
      })
      .then(() => {
        done();
      })
      .catch(done.fail);
  });

  it('should edit and fix some values', done => {
    nightmare
      .click(selectors.libraryView.editEntityButton)
      .clearInput(selectors.newEntity.form.realName)
      .write(selectors.newEntity.form.realName, 'Dr. Jonathan Crane')
      .clearInput(selectors.newEntity.form.age)
      .write(selectors.newEntity.form.age, '35')
      .write(
        selectors.newEntity.form.whoIsHe,
        'Scarecrow is depicted as a professor of psychology in Gotham ' +
          'City who uses a variety of fear-enhancing chemical agents to ' +
          'exploit the fears and phobias of his adversaries.'
      )
      .click(selectors.libraryView.saveButton)
      .wait('.alert.alert-success')
      .isVisible('.alert.alert-success')
      .then(result => {
        expect(result).toBe(true);
        return nightmare.waitToClick('.alert.alert-success');
      })
      .then(done)
      .catch(done.fail);
  });

  it('should refresh and check the values', done => {
    nightmare
      .waitForTheEntityToBeIndexed()
      .refresh()
      .waitToClick(selectors.libraryView.libraryFirstDocument)
      .wait(selectors.newEntity.viewer.title)
      .getInnerText(selectors.newEntity.viewer.title)
      .then(text => {
        expect(text).toBe('scarecrow');
        return nightmare.getInnerText(selectors.newEntity.viewer.realName);
      })
      .then(text => {
        expect(text).toBe('Dr. Jonathan Crane');
        return nightmare.getInnerText(selectors.newEntity.viewer.knownAccomplices);
      })
      .then(text => {
        expect(text).toBe('Joker');
        return nightmare.getInnerText(selectors.newEntity.viewer.mainSuperpower);
      })
      .then(text => {
        expect(text).toBe('fly');
        return nightmare.getInnerText(selectors.newEntity.viewer.superpowers);
      })
      .then(text => {
        expect(text).toBe('fly\nlaser beam\n');
        return nightmare.getInnerText(selectors.newEntity.viewer.whoIsHe);
      })
      .then(text => {
        expect(text.match('professor of psychology in Gotham')).not.toBe(null);
        return nightmare
          .click(selectors.libraryView.deleteButton)
          .waitToClick(selectors.libraryView.deleteButtonConfirmation)
          .waitForTheEntityToBeIndexed();
      })
      .then(() => {
        done();
      })
      .catch(done.fail);
  });

  it('should unpublish the entity', async () => {
    const cards = await nightmare.library
      .openCardSidePanel('scarecrow')
      .clickLink('Unpublish')
      .clickLink('Accept')
      .waitForTheEntityToBeIndexed()
      .waitToClick(selectors.navigation.uploadsNavButton)
      .wait(selectors.uploadsView.newEntityButtom)
      .waitForCardToBeCreated('scarecrow')
      .getResultsAsJson();

    const scarecrow = cards.find(c => c.title.toLowerCase() === 'scarecrow');
    expect(scarecrow).toBeDefined();
  });
});
