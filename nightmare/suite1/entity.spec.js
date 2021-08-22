/** @format */
/* eslint max-nested-callbacks: ["error", 10], max-len: ["error", 300] */

import { catchErrors } from 'api/utils/jasmineHelpers';
import selectors from '../helpers/selectors.js';
import createNightmare from '../helpers/nightmare';
import insertFixtures from '../helpers/insertFixtures';

const nightmare = createNightmare();

describe('Entity zone', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  describe('metadata editing', () => {
    it('should log in as admin and go into the entity viewer for the desired entity', done => {
      const entityTitle = 'Man-bat';

      nightmare
        .login('admin', 'admin')
        .openEntityFromLibrary(entityTitle)
        .getInnerText(selectors.entityView.contentHeader)
        .then(headerText => {
          expect(headerText).toContain(entityTitle);
          done();
        })
        .catch(catchErrors(done));
    });

    it("should allow changing the entity's title and template (common properties)", done => {
      nightmare
        .editEntityFromEntityViewer()
        .write(selectors.entityView.metadataFormTitle, ' (Dr. Langstrom)')
        .select(selectors.entityView.metadataFormType, '58ad7d240d44252fee4e61fb')
        .saveEntityFromEntityViewer()
        .getInnerText(selectors.entityView.contentHeader)
        .then(headerText => {
          expect(headerText).toContain('Man-bat (Dr. Langstrom)');
          expect(headerText).toContain('Super Villian');
        })
        .then(() =>
          nightmare
            .editEntityFromEntityViewer()
            .clearInput(selectors.entityView.metadataFormTitle)
            .write(selectors.entityView.metadataFormTitle, 'Man-bat')
            .saveEntityFromEntityViewer()
        )
        .then(() => {
          done();
        })
        .catch(catchErrors(done));
    });

    it("should allow changing the different template's properties", async () => {
      selectors.manBatEntity = {
        form: {
          realName:
            '#metadataForm > div:nth-child(3) > div:nth-child(1) > ul > li.wide > div > div > input',
          age: '#metadataForm > div:nth-child(3) > div:nth-child(2) > ul > li.wide > div > input',
          knownAccomplices: {
            joker:
              '#metadataForm > div:nth-child(3) > div:nth-child(3) > ul > li.wide > div > ul > li:nth-child(3) > label',
          },
          mainSuperpower:
            '#metadataForm > div:nth-child(3) > div:nth-child(4) > ul > li.wide > div > select',
          suporPowers: {
            fly:
              '#metadataForm > div:nth-child(3) > div:nth-child(5) > ul > li.wide > div > ul > li:nth-child(3) > label',
            laserBeam:
              '#metadataForm > div:nth-child(3) > div:nth-child(5) > ul > li.wide > div > ul > li:nth-child(8) > label',
            moreButton:
              '#metadataForm > div:nth-child(3) > div:nth-child(5) > ul > li.wide > div > ul > li:nth-child(7) > button',
          },
          firstSighting:
            '#metadataForm > div:nth-child(3) > div:nth-child(6) > ul > li.wide > div > div > div > input',
          whoIsHe:
            '#metadataForm > div:nth-child(3) > div.form-group.markdown > ul > li.wide > div > div > div > div.tab-content.tab-content-visible > textarea',
        },
        viewer: {
          realName:
            '#app > div.content > div > div > main > div > div.tab-content-visible > div > div > div.view > dl:nth-child(1) > dd',
          age:
            '#app > div.content > div > div > main > div > div.tab-content-visible > div > div > div.view > dl.metadata-type-numeric > dd',
          knownAccomplices:
            '#app > div.content > div > div > main > div > div.tab-content-visible > div > div > div.view > dl > dd > ul > li > a',
          mainSuperpower:
            '#app > div.content > div > div > main > div > div.tab-content-visible > div > div > div.view > dl:nth-child(4) > dd',
          superpowers:
            '#app > div.content > div > div > main > div > div.tab-content-visible > div > div > div.view > dl:nth-child(5) > dd > ul',
          firstSight:
            '#app > div.content > div > div > main > div > div.tab-content-visible > div > div > div.view > dl:nth-child(6) > dd',
          whoIsHe:
            '#app > div.content > div > div > main > div > div.tab-content-visible > div > div > div.view > dl:nth-child(7) > dd > div > p',
        },
      };

      await nightmare
        .editEntityFromEntityViewer()

        .select(selectors.entityView.metadataFormType, '58f0aed2e147e720856a0741')
        .wait(selectors.manBatEntity.form.realName)
        .write(selectors.manBatEntity.form.realName, 'Dr. Kirk Langstrom')
        .write(selectors.manBatEntity.form.age, '39')
        .waitToClick(selectors.manBatEntity.form.knownAccomplices.joker)
        .select(selectors.manBatEntity.form.mainSuperpower, 'b3eac310-8e9e-4adf-bd4c-13ed9f5765cb')
        .waitToClick(selectors.manBatEntity.form.suporPowers.moreButton)
        .waitToClick(selectors.manBatEntity.form.suporPowers.fly)
        .wait(selectors.manBatEntity.form.suporPowers.laserBeam)
        .waitToClick(selectors.manBatEntity.form.suporPowers.laserBeam)
        .pickToday(selectors.manBatEntity.form.firstSighting)
        .write(
          selectors.manBatEntity.form.whoIsHe,
          'This is your typical Jekyll and Hyde story: To cure his progressing ' +
            'deafness, Dr. Langstrom invented a serum to give him echolocation ' +
            '(a sonar that bats use to guide them in the dark). Yay science! ' +
            'Downside: the serum’s side-effects transformed sweet Dr. Langstrom ' +
            'into a hideous 7-foot mindless bat creature known as Man-Bat. To add ' +
            'to the minus column: the mutating serum is highly addictive, guaranteeing ' +
            'that Man-Bat will rear his ugly head over and over.'
        )
        .saveEntityFromEntityViewer()
        .refresh();
      expect(await nightmare.getInnerText(selectors.manBatEntity.viewer.realName)).toBe(
        'Dr. Kirk Langstrom'
      );
      expect(await nightmare.getInnerText(selectors.manBatEntity.viewer.age)).toBe('39');
      expect(await nightmare.getInnerText(selectors.manBatEntity.viewer.knownAccomplices)).toBe(
        'Joker'
      );
      expect(await nightmare.getInnerText(selectors.manBatEntity.viewer.mainSuperpower)).toBe(
        'fly'
      );
      expect(await nightmare.getInnerText(selectors.manBatEntity.viewer.superpowers)).toBe(
        'fly\nlaser beam\n'
      );
      const whoIsHe = await nightmare.getInnerText(selectors.manBatEntity.viewer.whoIsHe);
      expect(whoIsHe.match('Jekyll and Hyde story')).not.toBe(null);
    }, 20000);
  });
});
