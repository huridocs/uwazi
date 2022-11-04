/* eslint-disable no-await-in-loop */
/* eslint-disable max-statements */
// Run with ts-node, explicitly passing tsconfig, and ignore the compile errors. From the project root:
// yarn ts-node --project ./tsconfig.json --transpile-only ./scripts/relationships.v2/dryRun.ts <path-to-definition-file>
import fs from 'fs'
import process from 'process';

import { Db } from 'mongodb';

import { getClientAndDB } from './utilities/db'
import { objectIndex } from '../../app/shared/data_utils/objectIndex';

const print = (text: string) => process.stdout.write(text);

const batchsize = 1000;

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
}

class Connection {
    named: ConnectionInfo;
    withIds: ConnectionInfo;

    constructor(from: string[] | '*', through: '*' | string[], direction: string, to: string[] | '*') {
        this.named = new ConnectionInfo(from, through, direction, to);
        this.withIds = this.named.getCopyWithIds();
        this.nullCheck();
    }

    nullCheck() {
        const checkArray = (checkable: '*' | string[]) => {
            if (checkable !== '*' && checkable.filter(c => !c).length) {
                throw new Error(`There is a null/undefined type or template in a connection:\n${JSON.stringify(this.named)}`)
            }
        };
        checkArray(this.withIds.from);
        checkArray(this.withIds.through);
        checkArray(this.withIds.to);
    }

    get hashableString(){
        return this.withIds.hashableString;
    }
}

const collateNodeConnections = (node: any, resultArray: Connection[]) => {
    if(!node.traverse) return;
    node.traverse.forEach(edge => {
        if(!edge.match) throw new Error('Edge needs a match clause.');
        const targetTemplates = edge.match.map(node => node.templates);
        const connection = new Connection(
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
    const connections: Connection[] = [];
    filledDefinitions.forEach(node => collateNodeConnections(node, connections))

    const uniqueConnections: Connection[] = [];
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
    const connections = collateConnections(rawDefinitions);

    await client.close();
};

run();
