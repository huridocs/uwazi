/** @format */

import 'isomorphic-fetch';
import mongoose from 'mongoose';

import { templateTypes } from 'shared/templateTypes';

import entities from 'api/entities';
import templates from 'api/templates';
import dateHelper from 'api/utils/date';

import vault from './vault';
import vaultEvidencesModel from './vaultEvidencesModel';

const linkProp = template => template.properties.find(p => p.type === templateTypes.link).name;

const mediaProp = template => template.properties.find(p => p.type === templateTypes.media).name;

const imageProp = template => template.properties.find(p => p.type === templateTypes.image).name;

const dateProp = template => template.properties.find(p => p.type === templateTypes.date).name;

const vaultSync = {
  async sync(token, templateId) {
    const evidences = await vault.newEvidences(token);
    const template = await templates.getById(templateId);

    return evidences.reduce(async (prev, evidence) => {
      await prev;
      const zipPackage = await vault.downloadPackage(evidence);

      const [json, video, screenshot] = await zipPackage.evidences();

      const _id = mongoose.Types.ObjectId();

      await entities.save(
        {
          _id,
          title: json.title,
          metadata: {
            [linkProp(template)]: [{ value: { label: evidence.url, url: evidence.url } }],
            [dateProp(template)]: [
              { value: dateHelper.stringDateToUTCTimestamp(evidence.time_of_request) },
            ],
            [mediaProp(template)]: [
              {
                value: video
                  ? `/api/attachments/download?_id=${_id}&file=${evidence.request}.mp4`
                  : '',
              },
            ],
            [imageProp(template)]: [
              {
                value: screenshot
                  ? `/api/attachments/download?_id=${_id}&file=${evidence.request}.png`
                  : '',
              },
            ],
          },
          template: templateId,
          attachments: [
            video && {
              filename: `${evidence.request}.mp4`,
              originalname: `${json.title}.mp4`,
            },
            screenshot && {
              filename: `${evidence.request}.png`,
              originalname: `${json.title}.png`,
            },
            {
              filename: `${evidence.request}.zip`,
              originalname: `${json.title}.zip`,
            },
          ].filter(a => a),
        },
        { language: 'en', user: {} }
      );
      return vaultEvidencesModel.save({ request: evidence.request });
    }, Promise.resolve());
  },
};

export default vaultSync;
