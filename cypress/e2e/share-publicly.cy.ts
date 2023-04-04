import { login, logout } from './helpers';

const changeLanguage = () => {
  cy.get('.menuNav-language > .dropdown').click();
  cy.get('div[aria-label="Languages"]  li.menuNav-item:nth-child(2) a').click();
};

const englishLoggedInUwazi = (username = 'admin', password = 'admin') => {
  cy.visit('http://localhost:3000');
  changeLanguage();
  login(username, password);
};

const createUser = (userDetails: {
  username: string;
  password: string;
  email: string;
  group: string;
}) => {
  cy.get('.only-desktop a[aria-label="Settings"]').click();
  cy.contains('a', 'Users').click();
  cy.contains('button', 'Add user').click();
  cy.get('aside').get('input[name=email]').clear().type(userDetails.email);
  cy.get('aside').get('input[name=username]').clear().type(userDetails.username);
  cy.get('aside').get('input[name=password]').clear().type(userDetails.password);
  cy.get('aside').contains('span', userDetails.group).click();
  cy.get('aside').contains('button', 'Save').click();
};

describe('Share Publicly', () => {
  const entityTitle =
    'Artavia Murillo y otros. Resolución del Presidente de la Corte de 6 de agosto de 2012';
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-puppeteer-fixtures', { env });
  });

  it('should create a colaborator in the shared User Group', () => {
    englishLoggedInUwazi();
    cy.get('a[aria-label="Library"]').click();
    createUser({
      username: 'colla',
      password: 'borator',
      email: 'rock@stone.com',
      group: 'Asesores legales',
    });
  });

  it('should share an entity with the collaborator', () => {
    englishLoggedInUwazi();

    // TODO: Should select published entities better
    cy.get('aside').contains('span', 'Restricted').click();
    cy.contains('h2', entityTitle).click();
    cy.contains('button', 'Share').click();
    cy.get('[data-testid=modal] input').type('colla');
    cy.get('ul[role=listbox]').contains('span', 'colla').click();
    cy.get('div[data-testid=modal] select').eq(2).select('write');
    cy.contains('button', 'Save changes').click();
  });

  it('should unshare entities publicly', () => {
    englishLoggedInUwazi();

    // TODO: Should select published entities better
    cy.get('aside').contains('span', 'Restricted').click();
    cy.contains('h2', entityTitle).click();
    cy.contains('button', 'Share').click();
    cy.get('div[data-testid=modal] select').eq(1).select('delete');
    cy.contains('button', 'Save changes').click();
  });

  describe('share entities publicly', () => {
    beforeEach(() => {
      englishLoggedInUwazi();
    });

    it('should share the entity', () => {
      // TODO: Should select restricted entities better
      cy.get('aside').contains('span', 'Restricted').click();
      cy.contains('h2', entityTitle).click();
      cy.contains('button', 'Share').click();
      cy.get('[data-testid=modal] input').focus();
      cy.get('ul[role=listbox]').contains('span', 'Public').click();

      cy.contains('button', 'Save changes').click();
    });

    it('should not display the entity among the restricted ones', () => {
      // TODO: Should select restricted entities better
      cy.get('aside').contains('span', 'Published').click();
      cy.contains('h2', entityTitle).should('not.exist');
    });
  });

  describe('as a collaborator', () => {
    beforeEach(() => {
      englishLoggedInUwazi('colla', 'borator');
    });

    it('should not be able to unshare entities publicly', () => {
      cy.contains('h2', entityTitle).click();
      cy.contains('button', 'Share').click();
      cy.get('div[data-testid=modal] select').eq(1).should('not.exist');
      cy.contains('button', 'Close').click();
      cy.get('aside button[aria-label="Close side panel"]').eq(1).click();
    });

    it('should create an entity', () => {
      cy.contains('button', 'Create entity').click();
      cy.get('aside textarea').type('Test title');
      cy.contains('button', 'Save').click();
      cy.contains('div.alert', 'Entity created').click();
    });

    it('should not be able to share the entity', () => {
      // TODO: Should select restricted entities better
      cy.get('aside').contains('span', 'Published').click();
      cy.contains('h2', 'Test title').click();
      cy.contains('button', 'Share').click();
      cy.get('div[data-testid=modal] select').should('have.length', 2);
    });
  });

  it('should show mixed access', () => {
    englishLoggedInUwazi();
    cy.get('input[name="library.search.searchTerm"]').type('test 2016');
    cy.get('[aria-label="Search button"]').click();
    cy.get('.item-document').should('have.length', 3);
    cy.contains('button', 'Select all').click();
    cy.contains('button', 'Share').click();
    // await expectDocumentCountAfterSearch(page, 3);
    // await expect(page).toClick('button', { text: 'Select all' });
    // await expect(page).toClick('.is-active .share-btn', {
    //   text: 'Share',
    // });
    // await page.waitForSelector('.members-list tr:nth-child(2)');
    // await expect(page).toMatchElement('.members-list tr:nth-child(2) select', {
    //   text: 'Mixed access',
    // });
  });

  it('should keep publishing status if mixed access selected', () => {
    englishLoggedInUwazi();
    // await expect(page).toSelect('.member-list-wrapper  tr:nth-child(3) select', 'Can see');
    // await expect(page).toClick('button', { text: 'Save changes' });
    // await refreshIndex();
    // await page.reload();
    // await expectDocumentCountAfterSearch(page, 3);
    // expect(await countPrivateEntities()).toBe(1);
  });
});
