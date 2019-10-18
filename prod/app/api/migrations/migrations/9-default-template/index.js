"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0; /* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */var _default =
{
  delta: 9,

  name: 'default-template',

  description: 'Ensures there is a default template',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    const templates = await db.collection('templates').find().toArray();
    if (!templates.length) {
      templates.push({ name: 'Entity', default: true, properties: [] });
    }
    let defaultTemplate = templates.find(t => t.default);
    for (const template of templates) {
      if (!defaultTemplate) {
        template.default = true;
        defaultTemplate = template;
      }
      delete template.isEntity;
      await db.collection('templates').findOneAndUpdate({ _id: template._id }, template, { new: true, lean: true });
    }


    process.stdout.write('Added default template\r');
    process.stdout.write('\r\n');
  } };exports.default = _default;