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

let TEMPLATE_IDS_BY_NAME: Record<string, TemplateSchema> = {};
let RELATIONTYPE_IDS_BY_NAME: Record<string, RelationshipDBOType> = {};

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

const fillIdsForNode = (node: any) => {
    const newNode = {
        ...node,
        templates: node.templates === "*" ? node.templates : node.templates.map(name => TEMPLATE_IDS_BY_NAME[name]),
    }
    if(node.traverse) newNode.traverse = node.traverse.map(edge => fillIdsForEdge(edge));
    return newNode;
};

const fillIdsForEdge = (edge: any) => {
    return {
        ...edge,
        types: edge.types === "*"? edge.types : edge.types.map(name => RELATIONTYPE_IDS_BY_NAME[name]),
        match: edge.match.map(node => fillIdsForNode(node))
    }
}

const fillIds = (rawDefinitions: any[]) => {
    return rawDefinitions.map(def => fillIdsForNode(def));
};

const nullCheckElement = (element: any) => {
    const checkable = element.templates ? element.templates : element.types;
    if (checkable !== '*' && checkable.filter(c => !c).length) throw new Error('There is a null/undefined type or template.')
    const traversable = element.match ? element.match : element.traverse;
    if (traversable) traversable.forEach(t => nullCheckElement(t));
};

const nullCheck = (filledDefinitions: any[]) => {
    filledDefinitions.map(node => nullCheckElement(node));
};

class ConnectionInfo {
    from: string | any[];
    through: any[];
    direction: string;
    to: string | any[];
    constructor(from: any[] | string, through: any[], direction: string, to: any[] | string) {
        this.from = from;
        this.through = through;
        this.direction = direction;
        this.to = to;
    }

    get stringToHash(){
        return `from: ${JSON.stringify(this.from)} - through: ${JSON.stringify(this.through)} - direction: ${this.direction} - to: ${JSON.stringify(this.to)}`;
    }
}

const collateNodeConnections = (node: any, resultArray: any[]) => {
    if(!node.traverse) return;
    node.traverse.forEach(edge => {
        if(!edge.match) throw new Error('Edge needs a match clause.');
        const connection = new ConnectionInfo(
            node.templates,
            edge.types,
            edge.direction,
            edge.match.map(node => node.templates).flat()
        )
        resultArray.push(connection);
        edge.match.forEach(node => collateNodeConnections(node, resultArray));
    });
};

const collateConnections = (filledDefinitions: any[]) => {
    const connections = [];
    filledDefinitions.forEach(node => collateNodeConnections(node, connections))
    return connections;
};

const run = async () => {
    const {client, db} = await getClientAndDB();
    
    const rawDefinitions: any = readJsonFile(DEFINITION_FILE_PATH);
    
    await readTypes(db);
    const filledDefinitions = fillIds(rawDefinitions);
    nullCheck(filledDefinitions);
    const connections = collateConnections(rawDefinitions);
    console.log(connections);

    await client.close();
};

run();
