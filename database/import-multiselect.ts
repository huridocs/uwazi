/** @format */
/* eslint-disable no-await-in-loop, no-console, no-continue */

import { tcServer } from 'api/config/topicclassification';
import entities from 'api/entities';
import { EntitySchema } from 'api/entities/entityType';
import search from 'api/search/search';
import templates from 'api/templates';
import thesauri from 'api/thesauris';
import connect, { disconnect } from 'api/utils/connect_to_mongo';
import csv from 'csvtojson';
import { propertyTypes } from 'shared/propertyTypes';
import { ensure } from 'shared/tsUtils';
import JSONRequest from 'shared/JSONRequest';
import yargs from 'yargs';

const { input_csv: inputCsv, format: csvColumnsStr, store_model: storeModel, force } = yargs
  .option('input_csv', { default: '/home/bdittes/Downloads/PlanInternational_themes.csv' })
  .option('format', { default: 'add:themes,add:themes,search:paragraph_text,ignore' })
  .option('store_model', { default: 'planinternational_seqOnly-themes' })
  .option('force', { default: false })
  .help().argv;

async function storeSample(model: string, seq: string, trainingLabels: string[]) {
  const request = {
    samples: [
      {
        seq,
        training_labels: trainingLabels.map(label => ({
          topic: label,
        })),
      },
    ],
  };
  const response = await JSONRequest.post(
    `${tcServer}/classification_sample?model=${model}`,
    request
  );
  if (response.status !== 200) {
    console.error(response);
  }
}

async function buildMO(e: EntitySchema, propName: string, label: string) {
  const template = await templates.getById(e.template);
  if (!template || !template.properties) {
    throw new Error('Could not find template!');
  }
  const prop = template.properties.find(p => p.name === propName);
  if (!prop) {
    return undefined;
  }
  if (![propertyTypes.select, propertyTypes.multiselect].includes(prop.type)) {
    throw new Error(`Property ${propName} in template ${template.name} is not [multi]select!`);
  }
  const thesaurus = await thesauri.getById(prop.content);
  if (!thesaurus || !thesaurus.values) {
    throw new Error(`Can't find thesaurus of property ${propName} in template ${template.name}!`);
  }
  const value = thesaurus.values.find(v => v.label === label);
  if (!value || !value.id) {
    console.warn(
      `Can't find thesaurus label ${label} of property ${propName} in template ${template.name}!`
    );
    return undefined;
  }
  return { value: value.id, label };
}

function levenshtein(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) {
    return bn;
  }
  if (bn === 0) {
    return an;
  }
  const matrix = new Array<number[]>(bn + 1);
  for (let i = 0; i <= bn; i += 1) {
    matrix[i] = new Array<number>(an + 1);
    matrix[i][0] = i;
  }
  const firstRow = matrix[0];
  for (let j = 1; j <= an; j += 1) {
    firstRow[j] = j;
  }
  for (let i = 1; i <= bn; i += 1) {
    for (let j = 1; j <= an; j += 1) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] =
          Math.min(
            matrix[i - 1][j - 1], // substitution
            matrix[i][j - 1], // insertion
            matrix[i - 1][j] // deletion
          ) + 1;
      }
    }
  }
  return matrix[bn][an];
}

connect().then(
  async () => {
    try {
      if (!process.env.DATABASE_NAME) {
        throw new Error('You need to set $DATABASE_NAME!');
      }
      const columns: { op: 'ignore' | 'add' | 'search'; prop?: string }[] = csvColumnsStr
        .split(',')
        .map(s => {
          const parts = s.split(':');
          if (s === 'ignore') {
            return { op: 'ignore' };
          }
          if (parts.length !== 2 || !parts[1]) {
            throw new Error(`Did not understand input format ${s}.`);
          }
          if (parts[0] === 'add') {
            return { op: 'add', prop: parts[1] };
          }
          if (parts[0] === 'search') {
            return { op: 'search', prop: parts[1] };
          }
          throw new Error(`Did not understand input format ${s}.`);
        });
      await csv({
        noheader: true,
        output: 'csv',
      })
        .fromFile(inputCsv)
        .subscribe(async (row: string[]) => {
          let searchTerm = ' ';
          const trainingLabels: string[] = [];
          for (let i = 0; i < columns.length && i < row.length; i += 1) {
            const { prop } = columns[i];
            if (columns[i].op === 'ignore' || !prop) {
              continue;
            } else if (columns[i].op === 'search') {
              searchTerm = row[i];
            } else if (columns[i].op === 'add' && row[i]) {
              trainingLabels.push(row[i]);
            }
          }
          if (!searchTerm) {
            return;
          }
          if (storeModel) {
            await storeSample(storeModel, searchTerm, trainingLabels);
          }
          searchTerm = `"${searchTerm.replace(/"/g, "'")}"`;
          const results = await search.search(
            {
              searchTerm,
              limit: 10,
              includeUnpublished: true,
            },
            'en',
            'csv_import'
          );
          let foundMatch = false;
          for (let ie = 0; ie < results.rows.length; ie += 1) {
            const entity: EntitySchema = results.rows[ie];
            if (!entity.metadata) {
              continue;
            }
            const toSave: EntitySchema = {
              _id: entity._id,
              sharedId: entity.sharedId,
              title: entity.title,
              language: entity.language,
            };
            toSave.metadata = entity.metadata || {};
            let toSaveChanged = false;
            let foundGoodMo = false;
            let allMatch = true;
            for (let i = 0; i < columns.length && i < row.length; i += 1) {
              const { prop } = columns[i];
              if (columns[i].op === 'ignore' || !prop) {
                continue;
              }
              if (columns[i].op === 'search') {
                const mo = entity.metadata[prop];
                if (
                  !mo ||
                  !mo.length ||
                  !mo[0].value ||
                  levenshtein(ensure<string>(mo[0].value), row[i]) > 5
                ) {
                  allMatch = false;
                  break;
                }
              }
              if (columns[i].op === 'add') {
                const mo = await buildMO(entity, prop, row[i]);
                if (!mo) {
                  continue;
                }
                foundGoodMo = true;
                const mos = toSave.metadata[prop] || entity.metadata[prop] || [];
                if (!mos.find(prevMo => prevMo.label === row[i])) {
                  mos.push(mo);
                  toSave.metadata[prop] = mos;
                  toSaveChanged = true;
                }
              }
            }
            if (allMatch) {
              foundMatch = true;
              if (!foundGoodMo) {
                console.warn(
                  `Did not find any properties to expand for matching entity of template ${entity.template}.`
                );
              } else if (toSaveChanged || force) {
                await entities.save(
                  toSave,
                  { user: 'csv_import', language: entity.language },
                  false,
                  true
                );
                console.log(`Saved ${toSave.sharedId}`);
              }
              break;
            }
          }
          if (!foundMatch) {
            console.warn(`Did not find entity with search term ${searchTerm}`);
          }
        });
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
    return disconnect();
  },
  () => {}
);
