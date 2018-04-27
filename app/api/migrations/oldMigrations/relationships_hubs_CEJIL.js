import P from 'bluebird';

import relationshipsModel from '../relationships/model';
import entitiesModel from '../entities/entitiesModel';
import mongoose from 'mongoose';

const casesTemplateId = '58b2f3a35d59f31e1345b48a';
const provisionalMeasuresTemplateId = '58b2f3a35d59f31e1345b4a4';
const courtRelationshipType = '58b2f3a35d59f31e1345b53f';
const commissionRelationshipType = '58b2f3a35d59f31e1345b540';

const courtSentenceTemplateId = '58b2f3a35d59f31e1345b4ac';
const courtResolutionTemplateId = '58b2f3a35d59f31e1345b471';
const separateVoteRelationshipType = '58b2f3a35d59f31e1345b541';

let casesProcessed = 0;
let courtSentencesProcessed = 0;

function determineActions(caseRelationships, relationshipType) {
  let actions = {toDelete: [], toSave: []};

  const relevantHubs = caseRelationships.reduce((results, relationship) => {
    if (relationship.template && relationship.template.toString() === relationshipType) {
      results.push(relationship.hub.toString());
    }
    return results;
  }, []);

  if (relevantHubs.length) {
    actions = caseRelationships
    .filter(r => relevantHubs.indexOf(r.hub.toString()) !== -1)
    .reduce((results, relationship) => {
      if (relationship.hub.toString() !== relevantHubs[0] &&
          relationship.template && relationship.template.toString() === relationshipType) {
        results.toDelete.push({_id: relationship._id});
      } else {
        const switchedRelationship = Object.assign(
          {},
          relationship,
          {hub: relevantHubs[0]},
          !relationship.template ? {template: relationshipType} : {template: null}
        );
        results.toSave.push(switchedRelationship);
      }
      return results;
    }, actions);
  }

  return actions;
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

        const courtActions = determineActions(caseRelationships, courtRelationshipType);
        const commissionActions = determineActions(caseRelationships, commissionRelationshipType);

        return Promise.all([
          P.resolve(courtActions.toDelete).map(relationshipsModel.delete, {concurrency: 1}),
          P.resolve(courtActions.toSave).map(relationshipsModel.save, {concurrency: 1}),
          P.resolve(commissionActions.toDelete).map(relationshipsModel.delete, {concurrency: 1}),
          P.resolve(commissionActions.toSave).map(relationshipsModel.save, {concurrency: 1})
        ]);
      });
    }, {concurrency: 1})
    .catch(console.log);
  });
}

function processCourtSentencesAndResolutions() {
  console.log('');
  return entitiesModel.get({template: {$in: [courtSentenceTemplateId, courtResolutionTemplateId]}})
  .then(sentences => {
    return P.resolve(sentences).map(sentence => {
      courtSentencesProcessed += 1;
      process.stdout.write(`Processing court sentences and resolutions: ${courtSentencesProcessed} of ${sentences.length}\r`);

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
        const separateVoteActions = determineActions(sentenceRelationships, separateVoteRelationshipType);

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
.then(processCourtSentencesAndResolutions)
.then(() => {
  console.log('');
  console.log('Done!');
  mongoose.disconnect();
})
.catch(console.log);
