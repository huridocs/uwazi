import 'isomorphic-fetch';
import mongoose from 'mongoose';

import { propertyTypes } from 'shared/propertyTypes';

import entities from 'api/entities';
import { files } from 'api/files/files';
import templates from 'api/templates';
import dateHelper from 'api/utils/date';

import vault from './vault';
import vaultEvidencesModel from './vaultEvidencesModel';

const linkProp = template => template.properties.find(p => p.type === propertyTypes.link).name;

const mediaProp = template => template.properties.find(p => p.type === propertyTypes.media).name;

const imageProp = template => template.properties.find(p => p.type === propertyTypes.image).name;

const dateProp = template => template.properties.find(p => p.type === propertyTypes.date).name;

const isNumber = value => typeof value === 'number';

const updateMetadata = async (_createdEntity, template, videoId = '', imageId = '') => {
  const createdEntity = { ..._createdEntity };

  createdEntity.metadata[mediaProp(template)] = [{ value: videoId.toString() }];
  createdEntity.metadata[imageProp(template)] = [{ value: imageId.toString() }];

  return entities.save(createdEntity, { language: 'en', user: {} });
};

const saveAttachments = async (entitySharedId, evidence, json, video, screenshot) => {
  let videoId;
  let imageId;
  if (video) {
    const videoFile = await files.save({
      entity: entitySharedId,
      filename: `${evidence.request}.mp4`,
      originalname: `${json.title}.mp4`,
      type: 'attachment',
    });
    videoId = videoFile._id;
  }

  if (screenshot) {
    const imageFile = await files.save({
      entity: entitySharedId,
      filename: `${evidence.request}.png`,
      originalname: `${json.title}.png`,
      type: 'attachment',
    });
    imageId = imageFile._id;
  }

  await files.save({
    entity: entitySharedId,
    filename: `${evidence.request}.zip`,
    originalname: `${json.title}.zip`,
    type: 'attachment',
  });

  return { videoId, imageId };
};

const prepareEntity = (json, evidence, template) => {
  const _id = mongoose.Types.ObjectId();
  const entity = {
    _id,
    title: json.title,
    template: template._id,
    metadata: {
      [mediaProp(template)]: [{ value: '' }],
      [imageProp(template)]: [{ value: '' }],
    },
  };

  const timeOfRequest = dateHelper.stringDateToUTCTimestamp(evidence.time_of_request);
  // eslint-disable-next-line no-restricted-globals
  if (isNumber(timeOfRequest) && !isNaN(timeOfRequest)) {
    entity.metadata[dateProp(template)] = [{ value: timeOfRequest }];
  }
  if (evidence.url) {
    entity.metadata[linkProp(template)] = [{ value: { label: evidence.url, url: evidence.url } }];
  }

  return entity;
};

const createEntityFromEvidence = async (evidence, template) => {
  const zipPackage = await vault.downloadPackage(evidence);
  const [json, video, screenshot] = await zipPackage.evidences();
  const entity = prepareEntity(json, evidence, template);

  const createdEntity = await entities.save(entity, { language: 'en', user: {} });
  const { videoId, imageId } = await saveAttachments(
    createdEntity.sharedId,
    evidence,
    json,
    video,
    screenshot
  );

  await updateMetadata(createdEntity, template, videoId, imageId);
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
  },
};

export default vaultSync;
