import disableTransitions from '../helpers/disableTransitions';
import { clearAndType } from '../helpers/formActions';
import insertFixtures from '../helpers/insertFixtures';
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import { getPropertyOfSelector, getPropertiesOfSubelements } from '../helpers/selectorUtils';

const searchBoxSelector = '.search-box input';

describe('FullTextSearch zone', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  afterAll(async () => {
    await logout();
  });

  it('should show text snippets when performing a text search', async () => {
    await clearAndType(searchBoxSelector, 'Artavia Murillo');
    await expect(page).toClick('.search-box .input-group > svg:nth-child(2)');
    await page.waitForSelector('.item-snippet');
    const snippets = await getPropertiesOfSubelements(
      page,
      '.item-info',
      '.item-snippet',
      'textContent'
    );
    expect(snippets).toMatchObject(
      expect.arrayContaining([
        'Artavia Murillo et al',
        'Artavia Murillo y otros',
        'Artavia Murillo and others. Admissibility Report N° 25/04',
        'Artavia Murillo et al. Preliminary Objections, Merits, Reparations and Costs. Judgment.',
        'Artavia Murillo y otros. Resolución de la CorteIDH de 26 de febrero de 2016',
        'Artavia Murillo y otros. Resolución de la Corte IDH de 31 de marzo de 2014',
        'Artavia Murillo y otros. Resolución del Presidente de la Corte de 6 de agosto de 2012',
        'Artavia Murillo et al. Preliminary Objections, Merits, Reparations and Costs. Judgment.',
        'Artavia Murillo et al. Preliminary Objections, Merits, Reparations and Costs. Judgment.',
      ])
    );
  });

  describe('when clicking on a snippet', () => {
    it('should open the snippets tab on the sidePanel', async () => {
      await expect(page).toClick('.item-snippet', { text: 'Artavia Murillo y otros' });
      await page.waitForSelector('.is-active ul.snippet-list li:first-child');
      expect(
        await getPropertyOfSelector(
          page,
          '.is-active ul.snippet-list li:first-child',
          'textContent'
        )
      ).toBe('Title');
      expect(
        await getPropertyOfSelector(
          page,
          '.is-active ul.snippet-list li:nth-child(2)',
          'textContent'
        )
      ).toBe('Artavia Murillo y otros');
    });
  });

  it('should enter a document and perform a search text', async () => {
    await expect(page).toClick('.is-active .closeSidepanel');
    await expect(page).toClick('.item-name', {
      text: 'Artavia Murillo y otros. Resolución de la Corte IDH de 31 de marzo de 2014',
    });
    await expect(page).toClick('#tab-metadata');
    await expect(page).toClick('aside.is-active .sidepanel-footer a.edit-metadata');
    await expect(page).toClick('#tab-text-search');
    await clearAndType(`.is-active ${searchBoxSelector}`, 'Mauris\u000d');
    await page.waitForSelector('.snippet-text');
    const snippets = await getPropertiesOfSubelements(
      page,
      '.snippet-list-item',
      '.snippet-text',
      'textContent'
    );
    expect(snippets).toMatchObject(
      expect.arrayContaining([
        'maecenas\n' +
          'ligula nostra, accumsan taciti. Sociis mauris in integer, a dolor netus non dui aliquet,\n' +
          'sagittis felis sodales, dolor sociis mauris, vel eu libero cras. Interdum at.',
        'ullamcorper id tempor\n' +
          'eget id vitae. Mauris pretium eget aliquet, lectus tincidunt. Porttitor mollis\n' +
          'imperdiet libero senectus pulvinar. Etiam molestie mauris ligula eget\n' +
          'laoreet, vehicula eleifend',
        'risus. Justo fermentum id. Malesuada eleifend, tortor molestie, a\n' +
          'fusce a vel et. Mauris at suspendisse, neque aliquam faucibus adipiscing, vivamus in.\n' +
          'Wisi mattis leo suscipit',
      ])
    );
  }, 1000000);
});
