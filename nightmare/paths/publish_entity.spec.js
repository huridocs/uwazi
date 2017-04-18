/*eslint max-nested-callbacks: ["error", 10]*/
import config from '../helpers/config.js';
import selectors from '../helpers/selectors.js';
import {catchErrors} from 'api/utils/jasmineHelpers';
import createNightmare from '../helpers/nightmare';

const nightmare = createNightmare();

selectors.newEntity = {
  form: {
    title: '#metadataForm > div:nth-child(1) > ul > li.wide > div > textarea',
    type: '#metadataForm > div:nth-child(2) > ul > li.wide > select',
    realName: '#metadataForm > div:nth-child(4) > div:nth-child(1) > ul > li.wide > div > input',
    age: '#metadataForm > div:nth-child(4) > div:nth-child(2) > ul > li.wide > input',
    knownAccomplices: '#metadataForm > div:nth-child(4) > div:nth-child(3) > ul > li.wide > select',
    mainSuperpower: '#metadataForm > div:nth-child(4) > div:nth-child(4) > ul > li.wide > select',
    suporPowers: {
      fly: '#metadataForm > div:nth-child(4) > div:nth-child(5) > ul > li.wide > ul > li:nth-child(3) > label',
      laserBeam: '#metadataForm > div:nth-child(4) > div:nth-child(5) > ul > li.wide > ul > li:nth-child(5) > label > i.multiselectItem-icon.fa.fa-square-o'
    },
    firstSighting: '#metadataForm > div:nth-child(4) > div:nth-child(6) > ul > li.wide > div > input',
    whoIsHe: '#metadataForm > div:nth-child(4) > div:nth-child(7) > ul > li.wide > div > div.tab-content.tab-content-visible > textarea'
  },
  viewer: {
    title: '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div > div > h1',
    realName: '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > dl:nth-child(2) > dd',
    age: '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > dl:nth-child(3) > dd',
    knownAccomplices: '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > dl:nth-child(4) > dd > a',
    mainSuperpower: '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > dl:nth-child(5) > dd',
    superpowers: '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > dl:nth-child(6) > dd > ul',
    firstSight: '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > dl:nth-child(7) > dd',
    whoIsHe: '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > dl:nth-child(8) > dd > div > p'
  }
};

describe('publish entity path', () => {
  describe('login', () => {
    it('should log in as admin then click the uploads nav button', (done) => {
      nightmare
      .login('admin', 'admin')
      .waitToClick(selectors.navigation.uploadsNavButton)
      .wait(selectors.uploadsView.newEntityButtom)
      .url()
      .then((url) => {
        expect(url).toBe(config.url + '/uploads');
        done();
      })
      .catch(catchErrors(done));
    }, 10000);
  });

  it('should create a new entity and publish it', (done) => {
    nightmare
    .click(selectors.uploadsView.newEntityButtom)
    .type(selectors.newEntity.form.title, 'scarecrow')
    .select(selectors.newEntity.form.type, '58f0aed2e147e720856a0741')
    .type(selectors.newEntity.form.realName, '?')
    .type(selectors.newEntity.form.age, '40')
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
    .exists('.alert.alert-success')
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
      expect(text).toBe('flylaser beam');
    })
    .then(() => {
      done();
    });
  });

  it('should edit and fix some values', (done) => {
    nightmare
    .click(selectors.libraryView.editEntityButton)
    .clearInput(selectors.newEntity.form.realName)
    .type(selectors.newEntity.form.realName, 'Dr. Jonathan Crane')
    .clearInput(selectors.newEntity.form.age)
    .type(selectors.newEntity.form.age, '35')
    .type(selectors.newEntity.form.whoIsHe, 'Scarecrow is depicted as a professor of psychology in Gotham ' +
      'City who uses a variety of fear-enhancing chemical agents to ' +
      'exploit the fears and phobias of his adversaries.')
    .click(selectors.libraryView.saveButton)
    .wait('.alert.alert-success')
    .exists('.alert.alert-success')
    .then((result) => {
      expect(result).toBe(true);
      done();
    });
  });

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
      expect(text).toBe('flylaser beam');
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
    });
  });

  describe('closing browser', () => {
    it('should close the browser', (done) => {
      nightmare.end()
      .then(done);
    });
  });
});
