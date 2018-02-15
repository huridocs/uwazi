import selectors from './selectors.js';
import Nightmare from 'nightmare';

Nightmare.action('connections', {
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
    .then(done)
    .catch(done);
  },
  addNewRelationship(done) {
    this.waitToClick(selectors.connections.newRelationshipButton)
    .then(done)
    .catch(done);
  },
  selectRightHandRelation(optionSelector, number = 0, done) {
    this.evaluate_now((rightHandRelations, option, relationShipNumber) => {
      const helpers = document.__helpers;
      const relation = helpers.querySelectorAll(rightHandRelations)[relationShipNumber];
      helpers.querySelector('button', relation).click();
      helpers.querySelector(option, relation).click();
    }, done, selectors.connections.rightHandRelationships, optionSelector, number);
  },
  selectLeftHandRelation(optionSelector, number = 0, done) {
    this.evaluate_now((leftHandRelations, option, relationShipNumber) => {
      const helpers = document.__helpers;
      const relation = helpers.querySelectorAll(leftHandRelations)[relationShipNumber];
      helpers.querySelector('button', relation).click();
      helpers.querySelector(option, relation).click();
    }, done, selectors.connections.leftHandRelationships, optionSelector, number);
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
  getRelationsObjet(done) {
    this.evaluate_now(() => {
      const helpers = document.__helpers;
      let result = {};
      const hubs = helpers.querySelectorAll('.relationshipsHub');

      hubs.forEach((hub) => {
        let hubName = helpers.querySelector('.leftRelationshipType .rw-input', hub).innerText;
        result[hubName] = {};

        let rightHandRelations = helpers.querySelectorAll('.rightRelationshipsTypeGroup');
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
