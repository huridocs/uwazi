/*eslint max-nested-callbacks: ["error", 10]*/
import { catchErrors } from 'api/utils/jasmineHelpers';

import createNightmare from '../helpers/nightmare';
import selectors from '../helpers/selectors.js';

selectors.libraryView.filters = {
  firstPower: '#filtersForm > div:nth-child(1) > ul > li.wide > ul > li:nth-child(2) > label > span.multiselectItem-name',
  secondPower: '#filtersForm > div:nth-child(1) > ul > li.wide > ul > li:nth-child(3) > label > span.multiselectItem-name',
  sixthPower: '#filtersForm > div:nth-child(1) > ul > li.wide > ul > li:nth-child(6) > label > span.multiselectItem-name',
  fifthPower: '#filtersForm > div:nth-child(1) > ul > li.wide > ul > li:nth-child(5) > label > span.multiselectItem-name',
  superPowersAndOrSwitch: '#filtersForm > div:nth-child(1) > ul > li:nth-child(1) > div > label',
  searchButton: '#app > div.content > div > div > aside.side-panel.library-filters > div.sidepanel-footer > button',
  planetsConqueredFrom: '#filtersForm div.Numeric__From > input',
  planetsConqueredTo: '#filtersForm div.Numeric__To > input',
  dobFrom: '#filtersForm > div:nth-child(4) > ul > li.wide > div > div.DatePicker__From > div > input',
  dobTo: '#filtersForm > div:nth-child(4) > ul > li.wide > div > div.DatePicker__To > div > input'
};

const nightmare = createNightmare().gotoLibrary();

const filterBySuperVillian = () => (
  nightmare
  .library.clickFilter(selectors.libraryView.resetFilters)
  .library.clickFilter(selectors.libraryView.superVillianType)
);

const expectFilterToShowResult = (date, expected, selector) => (
  filterBySuperVillian()
  .library.typeFilter(selector, date)
  .getInnerText(selectors.libraryView.libraryFirstDocumentTitle)
  .then((text) => {
    expect(text).toBe(expected);
  })
);

const filterBySuperPowers = (power1, power2) => (
  filterBySuperVillian()
  .library.clickFilter(power1)
  .library.clickFilter(power2)
);

describe('search filters path', () => {
  describe('filter one type', () => {
    it('should only show entities of that type', (done) => {
      nightmare
      .library.clickFilter(selectors.libraryView.superVillianType)
      .getInnerText(selectors.libraryView.libraryFirstDocumentTitle)
      .then((text) => {
        expect(text).toBe('Scarecrow');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('filter by more types', () => {
    it('should show entities of those type', (done) => {
      nightmare.gotoLibrary()
      .library.clickFilter(selectors.libraryView.superVillianType)
      .library.clickFilter(selectors.libraryView.minorVillianType)
      .getInnerText(selectors.libraryView.libraryFirstDocumentTitle)
      .then((text) => {
        expect(text).toBe('Man-bat');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('multiselect filters', () => {
    it('should filter', (done) => {
      filterBySuperVillian()
      .library.clickFilter(selectors.libraryView.filters.sixthPower)
      .getInnerText(selectors.libraryView.libraryFirstDocumentTitle)
      .then((text) => {
        expect(text).toBe('Daneryl');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should filter by multiple options', (done) => {
      filterBySuperPowers(selectors.libraryView.filters.sixthPower, selectors.libraryView.filters.fifthPower)
      .getInnerText(selectors.libraryView.libraryFirstDocumentTitle)
      .then((text) => {
        expect(text).toBe('Daneryl');
        done();
      })
      .catch(catchErrors(done));
    }, 7000);

    describe('AND switch', () => {
      it('should filter entities having all the values selected', (done) => {
        filterBySuperPowers(selectors.libraryView.filters.firstPower, selectors.libraryView.filters.secondPower)
        .library.clickFilter(selectors.libraryView.filters.superPowersAndOrSwitch)
        .library.countFiltersResults()
        .then((resutls) => {
          expect(resutls).toBe(2);
          done();
        })
        .catch(catchErrors(done));
      }, 10000);
    });
  });

  describe('numeric filters', () => {
    const expectNumberOfPlanetsToShow = (expected, numberOfPlanets, selector = selectors.libraryView.filters.planetsConqueredFrom) => (
      expectFilterToShowResult(numberOfPlanets, expected, selector)
    );

    it('should filter by a range (120)', (done) => {
      expectNumberOfPlanetsToShow('Daneryl', 120).then(done).catch(catchErrors(done));
    });

    it('should filter by a range (400)', (done) => {
      expectNumberOfPlanetsToShow('Thanos', 140).then(done).catch(catchErrors(done));
    });

    it('should filter by a range (600)', (done) => {
      expectNumberOfPlanetsToShow('Scarecrow', 600, selectors.libraryView.filters.planetsConqueredTo).then(done).catch(catchErrors(done));
    });

    it('should filter by a range', (done) => {
      filterBySuperVillian()
      .library.typeFilter(selectors.libraryView.filters.planetsConqueredTo, 517)
      .library.typeFilter(selectors.libraryView.filters.planetsConqueredFrom, 516)
      .getInnerText(selectors.libraryView.libraryFirstDocumentTitle)
      .then((text) => {
        expect(text).toBe('Thanos');
        done();
      })
      .catch(catchErrors(done));
    }, 10000);
  });

  describe('date filters', () => {
    const expectFilterDateToShow = (expected, date, selector = selectors.libraryView.filters.dobFrom) => (
      expectFilterToShowResult(date, expected, selector)
    );
    it('should filter by a date for Daneryl', (done) => {
      expectFilterDateToShow('Daneryl', '18/05/1984').then(done).catch(catchErrors(done));
    });

    it('should filter by a date for Thanos', (done) => {
      expectFilterDateToShow('Thanos', '30/06/1939', selectors.libraryView.filters.dobTo).then(done).catch(catchErrors(done));
    });

    it('should filter by a range of dates for Daneryl', (done) => {
      filterBySuperVillian()
      .library.typeFilter(selectors.libraryView.filters.dobTo, '11/02/2000')
      .library.typeFilter(selectors.libraryView.filters.dobFrom, '11/02/1942')
      .getInnerText(selectors.libraryView.libraryFirstDocumentTitle)
      .then((text) => {
        expect(text).toBe('Daneryl');
        done();
      })
      .catch(catchErrors(done));
    }, 100000);
  });

  describe('closing browser', () => {
    it('should close the browser', (done) => {
      nightmare.end()
      .then(done);
    });
  });
});
