/* eslint-disable no-await-in-loop */
/* eslint-disable max-statements */
// Run with ts-node, explicitly passing tsconfig, and ignore the compile errors. From the project root:
// yarn ts-node --project ./tsconfig.json --transpile-only ./scripts/relationships.v2/dryRun.ts <path-to-definition-file>
import fs from 'fs'
import process from 'process';

import { Collection, FindCursor, Db, MongoError, MongoClient, ObjectId, OptionalId } from 'mongodb';

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
import { Connection } from 'puppeteer';

const print = (text: string) => process.stdout.write(text);

const batchsize = 1000;

const getClientAndDB = async () => {
  const url = process.env.DBHOST ? `mongodb://${process.env.DBHOST}/` : 'mongodb://localhost/';
  const client = new MongoClient(url);
  await client.connect();

  const db = client.db(process.env.DATABASE_NAME || 'uwazi_development');

  return {client, db};
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

let TEMPLATE_IDS_BY_NAME: Record<string, string> = {};
let RELATIONTYPE_IDS_BY_NAME: Record<string, string> = {};

const readTypes = async (db: Db) => {
    TEMPLATE_IDS_BY_NAME = objectIndex(
        await db.collection('templates').find().toArray(),
        t => t.name,
        t => t._id.toHexString()
    );
    RELATIONTYPE_IDS_BY_NAME = objectIndex(
        await db.collection('relationtypes').find().toArray(),
        r => r.name,
        r => r._id.toHexString()
    );
};

class ConnectionInfo {
    from: '*' | string[];
    through: '*' | string[];
    direction: string;
    to: '*' | string[];
    constructor(from: string[] | '*', through: '*' | string[], direction: string, to: string[] | '*') {
        this.from = from;
        this.through = through;
        this.direction = direction;
        this.to = to;
    }

    get hashableString(){
        return `from: ${JSON.stringify(this.from)} - through: ${JSON.stringify(this.through)} - direction: ${this.direction} - to: ${JSON.stringify(this.to)}`;
    }

    getCopyWithIds(){
        return new ConnectionInfo(
            this.from === "*" ? this.from : this.from.map(name => TEMPLATE_IDS_BY_NAME[name]),
            this.through === "*" ? this.through : this.through.map(name => RELATIONTYPE_IDS_BY_NAME[name]),
            this.direction,
            this.to === "*" ? this.to : this.to.map(name => TEMPLATE_IDS_BY_NAME[name])
        )
    }

    nullCheck() {
        const checkArray = (checkable: '*' | string[]) => {
            if (checkable !== '*' && checkable.filter(c => !c).length) throw new Error('There is a null/undefined type or template.')
        };
        checkArray(this.from);
        checkArray(this.through);
        checkArray(this.to);
    }
}

const fillIds = (rawConnections: any[]) => {
    const filledConnections = rawConnections.map(c => c.getCopyWithIds());
    filledConnections.forEach(c => c.nullCheck());
    return filledConnections;
};


const collateNodeConnections = (node: any, resultArray: ConnectionInfo[]) => {
    if(!node.traverse) return;
    node.traverse.forEach(edge => {
        if(!edge.match) throw new Error('Edge needs a match clause.');
        const targetTemplates = edge.match.map(node => node.templates);
        const connection = new ConnectionInfo(
            node.templates,
            edge.types,
            edge.direction,
            targetTemplates.some(t => t === "*") ? '*' : targetTemplates.flat(),
        )
        resultArray.push(connection);
        edge.match.forEach(node => collateNodeConnections(node, resultArray));
    });
};

const collateConnections = (filledDefinitions: any[]) => {
    const connections: ConnectionInfo[] = [];
    filledDefinitions.forEach(node => collateNodeConnections(node, connections))

    const uniqueConnections: ConnectionInfo[] = [];
    const hashSet = new Set();

    connections.forEach(c => {
        if(!hashSet.has(c.hashableString)) {
            hashSet.add(c.hashableString);
            uniqueConnections.push(c);
        }
    });

    return uniqueConnections;
};

const run = async () => {
    const {client, db} = await getClientAndDB();
    
    const rawDefinitions: any = readJsonFile(DEFINITION_FILE_PATH);
    
    await readTypes(db);
    const rawConnections = collateConnections(rawDefinitions);
    const filledConnections = fillIds(rawConnections);

    console.log(rawConnections);
    console.log(filledConnections);

    await client.close();
};

run();
