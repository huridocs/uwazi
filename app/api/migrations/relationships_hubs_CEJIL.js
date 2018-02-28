import P from 'bluebird';

import relationshipsModel from '../relationships/model';
import settings from '../settings/settings';
import relationships from '../relationships/relationships';
import templatesModel from '../templates/templates';
import relationtypes from '../relationtypes/relationtypes';
import entities from '../entities/entities';
import entitiesModel from '../entities/entitiesModel';
import mongoose from 'mongoose';
import {generateID} from 'api/odm';

const casesTemplateId = '58ada34c299e826748545061';
const provisionalMeasuresTemplateId = '58ada34c299e826748545078';
const courtRelationshipType = '58ada34d299e826748545115';

const courtSentenceTemplateId = '58ada34c299e82674854508a';
const separateVoteRelationshipType = '58ada34d299e826748545117';

let casesProcessed = 0;
let courtSentencesProcessed = 0;

function determineCaseCourtActions(caseRelationships) {
  let courtActions = {toDelete: [], toSave: []};

  const courtHubs = caseRelationships.reduce((results, relationship) => {
    if (relationship.template && relationship.template.toString() === courtRelationshipType) {
      results.push(relationship.hub.toString());
    }
    return results;
  }, []);

  if (courtHubs.length) {
    courtActions = caseRelationships.filter(r => courtHubs.indexOf(r.hub.toString()) !== -1)
    .reduce((results, relationship) => {
      if (relationship.hub.toString() !== courtHubs[0] &&
          relationship.template && relationship.template.toString() === courtRelationshipType) {
        results.toDelete.push({_id: relationship._id});
      } else {
        results.toSave.push(Object.assign({}, relationship, {hub: courtHubs[0]}));
      }
      return results;
    }, courtActions);
  }

  return courtActions;
}

function determineSeparateVoteActions(sentenceRelationships) {
  let separateVoteActions = {toDelete: [], toSave: []};

  const separateVoteHubs = sentenceRelationships.reduce((results, relationship) => {
    if (relationship.template && relationship.template.toString() === separateVoteRelationshipType) {
      results.push(relationship.hub.toString());
    }
    return results;
  }, []);

  if (separateVoteHubs.length) {
    separateVoteActions = sentenceRelationships
    .filter(r => separateVoteHubs.indexOf(r.hub.toString()) !== -1)
    .reduce((results, relationship) => {
      if (relationship.hub.toString() !== separateVoteHubs[0] &&
          relationship.template && relationship.template.toString() === separateVoteRelationshipType) {
        results.toDelete.push({_id: relationship._id});
      } else {
        results.toSave.push(Object.assign({}, relationship, {hub: separateVoteHubs[0]}));
      }
      return results;
    }, separateVoteActions);
  }

  return separateVoteActions;
}


function processCasesAndMeasures() {
  console.log('');
  return entitiesModel.get({template: {$in: [casesTemplateId, provisionalMeasuresTemplateId]}})
  .then(cases => {
    return P.resolve(cases).map(singleCase => {
      casesProcessed += 1;
      process.stdout.write(`Processing cases / measures: ${casesProcessed} of ${cases.length}\r`);
      // console.log('Case: ', casesProcessed, singleCase);
      return relationshipsModel.get({entity: singleCase.sharedId, language: singleCase.language})
      .then(caseDirectRelationships => {
        const caseHubs = caseDirectRelationships.reduce((hubs, relationship) => {
          if (hubs.indexOf(relationship.hub.toString()) === -1) {
            hubs.push(relationship.hub.toString());
          }

          return hubs;
        }, []);

        return relationshipsModel.get({hub: {$in: caseHubs}, language: singleCase.language});
      })
      .then(caseRelationships => {
        // console.log('caseRelationships:');
        // console.log(caseRelationships);

        const courtActions = determineCaseCourtActions(caseRelationships);

        return Promise.all([
          P.resolve(courtActions.toDelete).map(relationshipsModel.delete, {concurrency: 1}),
          P.resolve(courtActions.toSave).map(relationshipsModel.save, {concurrency: 1})
        ]);
      });
    }, {concurrency: 1})
    .catch(console.log);
  });
}

function processCourtSentences() {
  console.log('');
  return entitiesModel.get({template: courtSentenceTemplateId})
  .then(sentences => {
    return P.resolve(sentences).map(sentence => {
      courtSentencesProcessed += 1;
      process.stdout.write(`Processing court sentences: ${courtSentencesProcessed} of ${sentences.length}\r`);

      return relationshipsModel.get({entity: sentence.sharedId, language: sentence.language})
      .then(sentenceDirectRelationships => {
        const sentenceHubs = sentenceDirectRelationships.reduce((hubs, relationship) => {
          if (hubs.indexOf(relationship.hub.toString()) === -1) {
            hubs.push(relationship.hub.toString());
          }

          return hubs;
        }, []);

        return relationshipsModel.get({hub: {$in: sentenceHubs}, language: sentence.language});
      })
      .then(sentenceRelationships => {
        const separateVoteActions = determineSeparateVoteActions(sentenceRelationships);

        return Promise.all([
          P.resolve(separateVoteActions.toDelete).map(relationshipsModel.delete, {concurrency: 1}),
          P.resolve(separateVoteActions.toSave).map(relationshipsModel.save, {concurrency: 1})
        ]);
      });
    }, {concurrency: 1})
    .catch(console.log);
  });
}

processCasesAndMeasures()
.then(processCourtSentences)
.then(() => {
  console.log('');
  console.log('Done!');
  mongoose.disconnect();
})
.catch(console.log);
