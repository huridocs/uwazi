import createNightmare from '../helpers/nightmare';
import selectors from '../helpers/selectors.js';
import {catchErrors} from 'api/utils/jasmineHelpers';

const nightmare = createNightmare();

fdescribe('Connections', () => {
  describe('login', () => {
    it('should log in as admin', (done) => {
      nightmare.login('admin', 'admin')
      .then(done)
      .catch(catchErrors(done));
    }, 10000);
  });

  it('should find "Gotham attack" story and open it', (done) => {
    nightmare
    .librarySearch('Gotham attack')
    .waitFirstDocumentToMatch('Gotham attack')
    .waitToClick(selectors.libraryView.libraryFirstDocumentLink)
    .waitToClick(selectors.entityView.connectionsListView)
    .then(done)
    .catch(catchErrors(done));
  });

  it('should add "Event" relationType to "Gotham attack"', (done) => {
    nightmare
    .connections.edit()
    .connections.addNewRelationship()
    .connections.selectLeftHandRelation(selectors.connections.eventOption, 0)
    .then(done)
    .catch(catchErrors(done));
  });

  it('should add new relation group (perpetrator)', (done) => {
    nightmare
    .connections.selectRightHandRelation(selectors.connections.rightHandPerpetratorOption, 0)
    .then(done)
    .catch(catchErrors(done));
  });

  it('should add the perpetrators', (done) => {
    nightmare
    .connections.sidePanelSearchAndSelect('joker')
    .connections.sidePanelSearchAndSelect('scarecrow')
    .connections.sidePanelSearchAndSelect('Ra\'s al Ghul')
    .connections.sidePanelSearchAndSelect('robin')
    .connections.sidePanelSearchAndSelect('Talia al Ghul')
    .then(done)
    .catch(catchErrors(done));
  }, 10000);

  it('should add new relation group (heros)', (done) => {
    nightmare
    .connections.selectRightHandRelation(selectors.connections.rightHandHerosOption, 1)
    .then(done)
    .catch(catchErrors(done));
  });

  it('should add the perpetrators', (done) => {
    nightmare
    .connections.sidePanelSearchAndSelect('batman')
    .connections.sidePanelSearchAndSelect('alfred pennyworth')
    .then(done)
    .catch(catchErrors(done));
  }, 10000);

  it('should save the relations', (done) => {
    nightmare
    .connections.save()
    .then(done)
    .catch(catchErrors(done));
  });

  it('should render the relations properly after a save', (done) => {
    nightmare
    .connections.getRelationsObjet()
    .then((relations) => {
      expect(relations).toEqual({
        Event: {
          Heros: ['Batman', 'Alfred Pennyworth'],
          Perpetrator: ['Scarecrow', 'Robin', 'Talia al Ghul', 'Ra\'s al Ghul', 'Joker']
        }
      });
    })
    .then(done)
    .catch(catchErrors(done));
  });

  it('should render the relations properly after a reload', (done) => {
    nightmare
    .refresh()
    .waitToClick(selectors.entityView.connectionsListView)
    .connections.getRelationsObjet()
    .then((relations) => {
      expect(relations).toEqual({
        Event: {
          Heros: ['Batman', 'Alfred Pennyworth'],
          Perpetrator: ['Scarecrow', 'Robin', 'Talia al Ghul', 'Ra\'s al Ghul', 'Joker']
        }
      });
    })
    .then(done)
    .catch(catchErrors(done));
  });

  it('should fix the perpetrators, removing robin with an undo remove of talia', (done) => {
    nightmare
    .connections.edit()
    .connections.removeRelation('talia')
    .connections.removeRelation('robin')
    .connections.undoRemoveRelation('talia')
    .connections.save()
    .connections.getRelationsObjet()
    .then((relations) => {
      expect(relations).toEqual({
        Event: {
          Heros: ['Batman', 'Alfred Pennyworth'],
          Perpetrator: ['Scarecrow', 'Talia al Ghul', 'Ra\'s al Ghul', 'Joker']
        }
      });
    })
    .then(done)
    .catch(catchErrors(done));
  });

  describe('closing browser', () => {
    it('should close the browser', (done) => {
      nightmare.end()
      .then(done);
    });
  });
});
