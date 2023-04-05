import { should } from 'chai';
import { login, selectPublishedEntities, selectRestrictedEntities, createUser } from './helpers';
import { englishLoggedInUwazi } from './helpers/login';

describe('Share Entities', () => {
  const titleEntity1 =
    'Resolución de la Corte IDH. Supervisión de cumplimiento de Sentencia de 29 de junio de 2005';
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-puppeteer-fixtures', { env });
  });

  it('should create a collaborator in the shared User Group', () => {
    englishLoggedInUwazi();
    createUser({
      username: 'colla',
      password: 'borator',
      email: 'rock@stone.com',
      group: 'Asesores legales',
    });
  });

  // eslint-disable-next-line max-statements
  it('Should list available collaborators of an entity', async () => {
    englishLoggedInUwazi();

    // TODO: Better way to select restricted entities
    cy.get('aside').contains('span', 'Published').click();
    cy.contains('h2', titleEntity1).click();
    cy.contains('button', 'Share').should('be.visible').click();
    cy.get('[data-testid=modal] input').focus();
    cy.get('div[data-testid=modal]').should('be.visible').toMatchImageSnapshot();
    // await expect(page).toClick('.item-document', {
    //   text: titleEntity1,
    // });
    // await page.waitForSelector('.share-btn');
    // await expect(page).toClick('button', { text: 'Share' });
    // await expect(page).toClick('.userGroupsLookupField > input');
    // await page.waitForSelector('.userGroupsLookupField li .press-enter-note');
    // const availableCollaborators = await page.$$eval(
    //   '.userGroupsLookupField li .member-list-item',
    //   items => items.map(item => item.textContent)
    // );
    // expect(availableCollaborators).toEqual(['Activistas', 'Asesores legales', 'Public']);
  });
});
