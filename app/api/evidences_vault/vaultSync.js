import 'isomorphic-fetch';
import mongoose from 'mongoose';
import { isNumber } from 'util';

import { templateTypes } from 'shared/templateTypes';

import entities from 'api/entities';
import templates from 'api/templates';
import dateHelper from 'api/utils/date';

import vault from './vault';
import vaultEvidencesModel from './vaultEvidencesModel';


const linkProp = template =>
  template.properties.find(p => p.type === templateTypes.link).name;

const mediaProp = template =>
  template.properties.find(p => p.type === templateTypes.media).name;

const imageProp = template =>
  template.properties.find(p => p.type === templateTypes.image).name;

const dateProp = template =>
  template.properties.find(p => p.type === templateTypes.date).name;

const createEntityFromEvidence = async (evidence, template) => {
  const _id = mongoose.Types.ObjectId();
  const zipPackage = await vault.downloadPackage(evidence);
  const [json, video, screenshot] = await zipPackage.evidences();
  const entity = {
    _id,
    title: json.title,
    metadata: {
      [mediaProp(template)]: video ?
        `/api/attachments/download?_id=${_id}&file=${evidence.request}.mp4` :
        '',
      [imageProp(template)]: screenshot ?
        `/api/attachments/download?_id=${_id}&file=${evidence.request}.png` :
        ''
    },
    template: template._id,
    attachments: [
      video && {
        filename: `${evidence.request}.mp4`,
        originalname: `${json.title}.mp4`
      },
      screenshot && {
        filename: `${evidence.request}.png`,
        originalname: `${json.title}.png`
      },
      {
        filename: `${evidence.request}.zip`,
        originalname: `${json.title}.zip`
      },
    ].filter(a => a)
  };

  const timeOfRequest = dateHelper.stringDateToUTCTimestamp(evidence.time_of_request);
  // eslint-disable-next-line no-restricted-globals
  if (isNumber(timeOfRequest) && !isNaN(timeOfRequest)) {
    entity.metadata[dateProp(template)] = timeOfRequest;
  }
  if (evidence.url) {
    entity.metadata[linkProp(template)] = { label: evidence.url, url: evidence.url };
  }

  await entities.save(entity, { language: 'en', user: {} });
};

const vaultSync = {
  async sync(token, templateId) {
    const evidences = await vault.newEvidences(token);
    const template = await templates.getById(templateId);

    return evidences.reduce(async (prev, evidence) => {
      await prev;

      await createEntityFromEvidence(evidence, template);
      return vaultEvidencesModel.save({ request: evidence.request });
    }, Promise.resolve());
  }
};

export default vaultSync;
