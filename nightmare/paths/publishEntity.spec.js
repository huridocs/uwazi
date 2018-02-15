/*eslint max-nested-callbacks: ["error", 10]*/
import config from '../helpers/config.js';
import selectors from '../helpers/selectors.js';
import {catchErrors} from 'api/utils/jasmineHelpers';
import createNightmare from '../helpers/nightmare';

const nightmare = createNightmare();

describe('publish entity path', () => {
  describe('login', () => {
    it('should log in as admin then click the uploads nav button', (done) => {
      nightmare
      .login('admin', 'admin')
      .waitToClick(selectors.navigation.uploadsNavButton)
      .wait(selectors.uploadsView.newEntityButtom)
      .url()
      .then((url) => {
        expect(url.match(config.url + '/uploads')).not.toBe(null);
        done();
      })
      .catch(catchErrors(done));
    }, 10000);
  });

  it('should create a new entity and publish it', (done) => {
    nightmare
    .click(selectors.uploadsView.newEntityButtom)
    .write(selectors.newEntity.form.title, 'scarecrow')
    .select(selectors.newEntity.form.type, '58f0aed2e147e720856a0741')
    .write(selectors.newEntity.form.realName, '?')
    .write(selectors.newEntity.form.age, '40')
    .select(selectors.newEntity.form.knownAccomplices, 'o184buh2w179o1or')
    .select(selectors.newEntity.form.mainSuperpower, 'b3eac310-8e9e-4adf-bd4c-13ed9f5765cb')
    .waitToClick(selectors.newEntity.form.suporPowers.fly)
    .wait(selectors.newEntity.form.suporPowers.laserBeam)
    .waitToClick(selectors.newEntity.form.suporPowers.laserBeam)
    .pickToday(selectors.newEntity.form.firstSighting)
    .click(selectors.uploadsView.saveButton)
    .waitToClick(selectors.uploadsView.firstPublishButton)
    .waitToClick(selectors.uploadsView.acceptPublishModel)
    .wait('.alert.alert-success')
    .isVisible('.alert.alert-success')
    .then((result) => {
      expect(result).toBe(true);
      done();
    });
  });

  it('should go to library and check the values', (done) => {
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

  it('should edit and fix some values', (done) => {
    nightmare
    .click(selectors.libraryView.editEntityButton)
    .clearInput(selectors.newEntity.form.realName)
    .write(selectors.newEntity.form.realName, 'Dr. Jonathan Crane')
    .clearInput(selectors.newEntity.form.age)
    .write(selectors.newEntity.form.age, '35')
    .write(selectors.newEntity.form.whoIsHe, 'Scarecrow is depicted as a professor of psychology in Gotham ' +
      'City who uses a variety of fear-enhancing chemical agents to ' +
      'exploit the fears and phobias of his adversaries.')
    .click(selectors.libraryView.saveButton)
    .wait('.alert.alert-success')
    .isVisible('.alert.alert-success')
    .then((result) => {
      expect(result).toBe(true);
      done();
    })
    .catch(done.fail);
  }, 10000);

  it('should refresh and check the values', (done) => {
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
      return nightmare.click(selectors.libraryView.deleteButton)
      .waitToClick(selectors.libraryView.deleteButtonConfirmation)
      .waitForTheEntityToBeIndexed();
    })
    .then(() => {
      done();
    })
    .catch(done.fail);
  }, 10000);

  describe('closing browser', () => {
    it('should close the browser', (done) => {
      nightmare.end()
      .then(done);
    });
  });
});
