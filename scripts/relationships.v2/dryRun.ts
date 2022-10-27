/* eslint-disable no-await-in-loop */
/* eslint-disable max-statements */
// Run with ts-node, explicitly passing tsconfig, and ignore the compile errors. From the project root:
// yarn ts-node --project ./tsconfig.json --transpile-only ./scripts/relationships.v2/dryRun.ts
import fs, { symlinkSync } from 'fs'
import process from 'process';

import mongodb, { Collection, FindCursor, Db, MongoError, ObjectId, OptionalId } from 'mongodb';

import { BulkWriteStream } from '../../app/api/common.v2/database/BulkWriteStream';
import { RelationshipDBOType } from '../../app/api/relationships.v2/database/schemas/relationshipTypes'
import date from '../../app/api/utils/date';
import { objectIndex } from '../../app/shared/data_utils/objectIndex';
import { EntitySchema } from '../../app/shared/types/entityType';
import { Settings } from '../../app/shared/types/settingsType';
import { TemplateSchema } from '../../app/shared/types/templateType';
import { UserSchema } from '../../app/shared/types/userType';
import ID from '../../app/shared/uniqueID';
import { json } from 'body-parser';

const print = (text: string) => process.stdout.write(text);

const batchsize = 1000;

const getClient = async () => {
  const url = process.env.DBHOST ? `mongodb://${process.env.DBHOST}/` : 'mongodb://localhost/';
  const client = new mongodb.MongoClient(url);
  await client.connect();

  return client;
};

const DEFINITION_FILE_PATH = process.argv.length > 2 ? process.argv[2] : undefined;

const readJsonFile = (path: string | undefined): Object => {
    if(!path) {
        print('Provide path for definition file.\n');
        process.exit(1)
    }
    if(!fs.existsSync(path)) {
        print('Provide path does not exist.\n');
        process.exit(1)
    }
    if(!fs.lstatSync(path).isFile()) {
        print('Provide path is not a file.\n');
        process.exit(1)
    }
    return JSON.parse(fs.readFileSync(path, 'utf8'));
};

const run = async () => {
    const rawDefinition = readJsonFile(DEFINITION_FILE_PATH);
    console.log(rawDefinition);
};

run();
