/*eslint max-nested-callbacks: ["error", 10]*/
import selectors from '../helpers/selectors.js';
import {catchErrors} from 'api/utils/jasmineHelpers';
import createNightmare from '../helpers/nightmare';

const searchRequestTime = 500;
selectors.libraryView.filters = {
  firstPower: '#filtersForm > div:nth-child(1) > ul > li.wide > ul > li:nth-child(2) > label > span.multiselectItem-name',
  secondPower: '#filtersForm > div:nth-child(1) > ul > li.wide > ul > li:nth-child(3) > label > span.multiselectItem-name',
  sixthPower: '#filtersForm > div:nth-child(1) > ul > li.wide > ul > li:nth-child(6) > label > span.multiselectItem-name',
  fifthPower: '#filtersForm > div:nth-child(1) > ul > li.wide > ul > li:nth-child(5) > label > span.multiselectItem-name',
  superPowersAndOrSwitch: '#filtersForm > div:nth-child(1) > ul > li:nth-child(1) > div > label',
  searchButton: '#app > div.content > div > div > aside.side-panel.library-filters.is-hidden > div.sidepanel-footer > button',
  planetsConqueredFrom: '#filtersForm div.Numeric__From > input',
  planetsConqueredTo: '#filtersForm div.Numeric__To > input',
  dobFrom: '#filtersForm div.DatePicker__From > div > input',
  dobTo: '#filtersForm div.DatePicker__To > div > input'
};

const nightmare = createNightmare().gotoLibrary();

describe('search filters path', () => {
  describe('filter one type', () => {
    it('should only show entities of that type', (done) => {
      nightmare
      .waitToClick(selectors.libraryView.superVillianType)
      .wait(searchRequestTime)
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
      .waitToClick(selectors.libraryView.superVillianType)
      .waitToClick(selectors.libraryView.minorVillianType)
      .wait(searchRequestTime)
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
      nightmare
      .waitToClick(selectors.libraryView.resetFilters)
      .waitToClick(selectors.libraryView.superVillianType)
      .wait(searchRequestTime)
      .waitToClick(selectors.libraryView.filters.sixthPower)
      .wait(searchRequestTime + 200)
      .getInnerText(selectors.libraryView.libraryFirstDocumentTitle)
      .then((text) => {
        expect(text).toBe('Daneryl');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should filter by multiple options', (done) => {
      nightmare
      .waitToClick(selectors.libraryView.resetFilters)
      .waitToClick(selectors.libraryView.superVillianType)
      .wait(searchRequestTime)
      .waitToClick(selectors.libraryView.filters.sixthPower)
      .waitToClick(selectors.libraryView.filters.fifthPower)
      .wait(searchRequestTime + 200)
      .getInnerText(selectors.libraryView.libraryFirstDocumentTitle)
      .then((text) => {
        expect(text).toBe('Daneryl');
        done();
      })
      .catch(catchErrors(done));
    });

    describe('AND switch', () => {
      it('should filter entities having all the values selected', (done) => {
        nightmare
        .waitToClick(selectors.libraryView.resetFilters)
        .waitToClick(selectors.libraryView.superVillianType)
        .wait(searchRequestTime)
        .waitToClick(selectors.libraryView.filters.firstPower)
        .waitToClick(selectors.libraryView.filters.secondPower)
        .waitToClick(selectors.libraryView.filters.superPowersAndOrSwitch)
        .wait(searchRequestTime + 200)
        .countFiltersResults()
        .then((resutls) => {
          expect(resutls).toBe(2);
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('numeric filters', () => {
    it('should filter by a range', (done) => {
      nightmare
      .waitToClick(selectors.libraryView.resetFilters)
      .waitToClick(selectors.libraryView.superVillianType)
      .wait(searchRequestTime)
      .write(selectors.libraryView.filters.planetsConqueredFrom, 120)
      .waitToClick(selectors.libraryView.filters.searchButton)
      .wait(searchRequestTime + 200)
      .getInnerText(selectors.libraryView.libraryFirstDocumentTitle)
      .then((text) => {
        expect(text).toBe('Daneryl');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should filter by a range', (done) => {
      nightmare
      .waitToClick(selectors.libraryView.resetFilters)
      .waitToClick(selectors.libraryView.superVillianType)
      .wait(searchRequestTime)
      .write(selectors.libraryView.filters.planetsConqueredFrom, 140)
      .waitToClick(selectors.libraryView.filters.searchButton)
      .wait(searchRequestTime + 200)
      .getInnerText(selectors.libraryView.libraryFirstDocumentTitle)
      .then((text) => {
        expect(text).toBe('Thanos');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should filter by a range', (done) => {
      nightmare
      .waitToClick(selectors.libraryView.resetFilters)
      .waitToClick(selectors.libraryView.superVillianType)
      .wait(searchRequestTime)
      .write(selectors.libraryView.filters.planetsConqueredTo, 600)
      .waitToClick(selectors.libraryView.filters.searchButton)
      .wait(searchRequestTime + 200)
      .getInnerText(selectors.libraryView.libraryFirstDocumentTitle)
      .then((text) => {
        expect(text).toBe('Scarecrow');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should filter by a range', (done) => {
      nightmare
      .waitToClick(selectors.libraryView.resetFilters)
      .waitToClick(selectors.libraryView.superVillianType)
      .wait(searchRequestTime)
      .write(selectors.libraryView.filters.planetsConqueredFrom, 516)
      .write(selectors.libraryView.filters.planetsConqueredTo, 517)
      .waitToClick(selectors.libraryView.filters.searchButton)
      .wait(searchRequestTime + 200)
      .getInnerText(selectors.libraryView.libraryFirstDocumentTitle)
      .then((text) => {
        expect(text).toBe('Thanos');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('date filters', () => {
    it('should filter by a date for Daneryl', (done) => {
      nightmare
      .waitToClick(selectors.libraryView.resetFilters)
      .waitToClick(selectors.libraryView.superVillianType)
      .wait(searchRequestTime)
      .write(selectors.libraryView.filters.dobFrom, '18/05/1984')
      .waitToClick(selectors.libraryView.filters.searchButton)
      .wait(searchRequestTime)
      .getInnerText(selectors.libraryView.libraryFirstDocumentTitle)
      .then((text) => {
        expect(text).toBe('Daneryl');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should filter by a date for Thanos', (done) => {
      nightmare.gotoLibrary()
      .waitToClick(selectors.libraryView.superVillianType)
      .wait(searchRequestTime)
      .write(selectors.libraryView.filters.dobTo, '30/06/1939')
      .waitToClick(selectors.libraryView.filters.searchButton)
      .wait(searchRequestTime)
      .getInnerText(selectors.libraryView.libraryFirstDocumentTitle)
      .then((text) => {
        expect(text).toBe('Thanos');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should filter by a range of dates for Daneryl', (done) => {
      nightmare.gotoLibrary()
      .waitToClick(selectors.libraryView.superVillianType)
      .wait(searchRequestTime)
      .write(selectors.libraryView.filters.dobFrom, '11/02/1942')
      .wait(searchRequestTime)
      .write(selectors.libraryView.filters.dobTo, '11/02/2000')
      .wait(searchRequestTime)
      .getInnerText(selectors.libraryView.libraryFirstDocumentTitle)
      .then((text) => {
        expect(text).toBe('Daneryl');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('closing browser', () => {
    it('should close the browser', (done) => {
      nightmare.end()
      .then(done);
    });
  });
});
