import selectors from './selectors.js';
import Nightmare from 'nightmare';

Nightmare.action('connections', {
  waitForRelationHubs(done) {
    this.wait('.relationshipsHub').then(done);
  },
  sortBy(orderByText, done) {
    this.waitToClick(selectors.connections.sortMenu)
    .evaluate((sortBy) => {
      const helpers = document.__helpers;
      const sortOptions = helpers.querySelectorAll('.sort-buttons .Dropdown-option a');

      sortOptions.forEach((option) => {
        if (option.innerText.toLowerCase().trim() === sortBy.toLowerCase().trim()) {
          option.click();
        }
      });
    }, orderByText)
    .wait(300)
    .then(done);
  },
  edit(done) {
    this.waitToClick(selectors.connections.editButton)
    .then(done)
    .catch(done);
  },
  save(done) {
    this.waitToClick(selectors.connections.saveButton)
    .wait(() => {
      const element = document.querySelector('.removeHub');
      return element ? false : true;
    })
    .connections.waitForSave()
    .then(done)
    .catch(done);
  },
  addNewRelationship(done) {
    this.waitToClick(selectors.connections.newRelationshipButton)
    .then(done)
    .catch(done);
  },
  selectRelationOption(optionSelector, relationsSelector, relationshipNumber, done) {
    this.wait((selector, selectorForRelations, number) => {
      const helpers = document.__helpers;
      const relation = helpers.querySelectorAll(selectorForRelations)[number];
      const option = relation.querySelector(selector);
      if (option) {
        option.click();
        return true;
      }
      return false;
    }, optionSelector, relationsSelector, relationshipNumber)
    .then(done)
    .catch(done);
  },
  selectRightHandRelation(optionSelector, number, done) {
    this.evaluate((option, relationshipNumber) => {
      const helpers = document.__helpers;
      const relation = helpers.querySelectorAll('div.rightRelationshipsTypeGroup > div.rightRelationshipType')[relationshipNumber];
      helpers.querySelector('button', relation).click();
    }, optionSelector, number)
    .connections.selectRelationOption(optionSelector, 'div.rightRelationshipsTypeGroup > div.rightRelationshipType', number)
    .then(done)
    .catch(done);
  },
  selectLeftHandRelation(optionSelector, number, done) {
    this.evaluate((option, relationshipNumber) => {
      const helpers = document.__helpers;
      const relation = helpers.querySelectorAll('div.leftRelationshipType')[relationshipNumber];
      helpers.querySelector('button', relation).click();
    }, optionSelector, number)
    .connections.selectRelationOption(optionSelector, 'div.leftRelationshipType', number)
    .then(done)
    .catch(done);
  },
  search(term, done) {
    this.write(selectors.connections.searchInput, term)
    .type(selectors.connections.searchInput, '\u000d')
    .wait(300)
    .then(done)
    .catch(done);
  },
  sidePanelSearchAndSelect(term, done) {
    this.connections.sidepanelSearch(term)
    .connections.sidepanelSelect(term)
    .then(done)
    .catch(done);
  },
  sidepanelSearch(term, done) {
    this.clearInput(selectors.connections.sidePanelSearchInput)
    .write(selectors.connections.sidePanelSearchInput, term)
    .then(done)
    .catch(done);
  },
  sidepanelSelect(matchingTitle, done) {
    this.wait(selectors.connections.sidePanelFirstDocument)
    .wait((termToMatch, selector) => {
      const element = document.querySelectorAll(selector)[0];
      if (element) {
        return element.innerText.toLowerCase().match(termToMatch.toLowerCase());
      }
      return false;
    }, matchingTitle, selectors.connections.sidePanelDocuments)
    .evaluate((toMatch, selector) => {
      const helpers = document.__helpers;
      const elements = helpers.querySelectorAll(selector);
      let found;
      elements.forEach((element) => {
        if (found) {
          return;
        }
        if (element.innerText.toLowerCase() === toMatch.toLowerCase()) {
          found = element;
        }
      });
      found.click();
    }, matchingTitle, selectors.connections.sidePanelDocuments)
    .then(done)
    .catch(done);
  },
  clickRemoveRelationButton(matchingTitle, done) {
    this.evaluate_now((term) => {
      const helpers = document.__helpers;
      let relations = helpers.querySelectorAll('.rightRelationship');
      relations.forEach((relation) => {
        if (relation.innerText.toLowerCase().match(term.toLowerCase())) {
          helpers.querySelector('.removeEntity i', relation).click();
        }
      });
    }, done, matchingTitle)
    .catch(done);
  },
  clickRemoveRelationGroupButton(matchingTitle, done) {
    this.evaluate_now((term) => {
      const helpers = document.__helpers;
      let relations = helpers.querySelectorAll('.rightRelationshipType');
      relations.forEach((relation) => {
        if (relation.innerText.toLowerCase().match(term.toLowerCase())) {
          relation.nextSibling.querySelector('i').click();
        }
      });
    }, done, matchingTitle)
    .catch(done);
  },
  removeRelationGroup(matchingTitle, done) {
    this.connections.clickRemoveRelationGroupButton(matchingTitle)
    .then(done)
    .catch(done);
  },
  undoRemoveRelationGroup(matchingTitle, done) {
    this.connections.clickRemoveRelationGroupButton(matchingTitle)
    .then(done)
    .catch(done);
  },
  removeRelation(matchingTitle, done) {
    this.connections.clickRemoveRelationButton(matchingTitle)
    .then(done)
    .catch(done);
  },
  undoRemoveRelation(matchingTitle, done) {
    this.connections.clickRemoveRelationButton(matchingTitle)
    .then(done)
    .catch(done);
  },
  goTo(matchingTitle, done) {
    this.evaluate((title) => {
      const helpers = document.__helpers;
      const items = helpers.querySelectorAll('.relationships-graph .item-name');

      items.forEach((item) => {
        if (item.innerText.toLowerCase() === title.toLowerCase()) {
          item.click();
        }
      });
    }, matchingTitle)
    .then(done)
    .catch(done);
  },
  waitForSave(done) {
    this.wait(() => {
      const deleteButtons = document.querySelectorAll('.relationships-removeIcon');
      return deleteButtons.length === 0;
    })
    .wait('.leftRelationshipType .rw-input')
    .then(done)
    .catch(done);
  },

  getRelationsObjet(done) {
    this.evaluate_now(() => {
      const helpers = document.__helpers;
      let result = {};
      const hubs = helpers.querySelectorAll('.relationshipsHub');

      hubs.forEach((hub, index) => {
        let hubName = helpers.querySelector('.leftRelationshipType .rw-input', hub).innerText;
        if (result[hubName]) {
          hubName += index;
        }
        result[hubName] = {};

        let rightHandRelations = helpers.querySelectorAll('.rightRelationshipsTypeGroup', hub);
        rightHandRelations.forEach((relation) => {
          let relationName = helpers.querySelector('.rw-input', relation).innerText;
          result[hubName][relationName] = [];
          relation.querySelectorAll('.item-name').forEach((item) => {
            result[hubName][relationName].push(item.innerText);
          });
        });
      });
      return result;
    }, done);
  }
});
