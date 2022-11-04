/* eslint-disable no-await-in-loop */
/* eslint-disable max-statements */
// Run with ts-node, explicitly passing tsconfig, and ignore the compile errors. From the project root:
// yarn ts-node --project ./tsconfig.json --transpile-only ./scripts/relationships.v2/dryRun.ts <required-path-to-definition-file> <optional-path-to-result-file>
import fs from 'fs'
import process from 'process';

import { Db } from 'mongodb';

import { objectIndex } from '../../app/shared/data_utils/objectIndex';
import { CsvWriter } from './utilities/csv';
import { createTempCollections, getClientAndDB } from './utilities/db'
import { ConnectionType, gatherHubs, HubType } from './utilities/hubs';
import { println } from './utilities/log';

const batchsize = 1000;

const DEFINITION_FILE_PATH = process.argv.length > 2 ? process.argv[2] : undefined;
const RESULT_FILE_PATH = process.argv.length > 3 ? process.argv[3] : undefined;

const temporaryHubCollectionName = '__temporary_hub_collection';


const readJsonFile = (path: string | undefined): Object => {
    if(!path) {
        println('Provide path for definition file.');
        process.exit(1)
    }
    if(!fs.existsSync(path)) {
        println('Provide path does not exist.');
        process.exit(1)
    }
    if(!fs.lstatSync(path).isFile()) {
        println('Provide path is not a file.');
        process.exit(1)
    }
    return JSON.parse(fs.readFileSync(path, 'utf8'));
};

let TEMPLATE_IDS_BY_NAME: Record<string, string> = {};
let RELATIONTYPE_IDS_BY_NAME: Record<string, string> = {};
let RELATIONTYPE_NAMES_BY_ID: Record<string, string> = {};

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
    RELATIONTYPE_NAMES_BY_ID = Object.fromEntries(Object.entries(RELATIONTYPE_IDS_BY_NAME).map(([name, id]) => [id, name]));
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

const NO_CLASS_MARKER = 'NO_CLASS'

enum HubClasses {
    NO_UNTYPED_EDGE = 'NO_UNTYPED_EDGE'
}

type HubClassifier = (hub: HubType, connections: ConnectionType[]) => boolean;

const hubClassifiers: { [key in HubClasses]: HubClassifier } = {
    [HubClasses.NO_UNTYPED_EDGE]: (hub: HubType, connections: ConnectionType[]) => connections.every(c => c.template)
};

const classifyHub = (hub: HubType, connections: ConnectionType[]) => {
    const classes: HubClasses[] = [];
    Object.values(HubClasses).forEach(cls => {
        const classifier = hubClassifiers[cls];
        if(classifier(hub, connections)) {
            classes.push(cls);
        }
    })
    return classes.length ? classes.join(' ') : NO_CLASS_MARKER;
}

const run = async () => {
    const {client, db} = await getClientAndDB();
    
    await readTypes(db);
    const rawDefinitions: any = readJsonFile(DEFINITION_FILE_PATH);    
    const connections = collateConnections(rawDefinitions);

    await createTempCollections(db, [temporaryHubCollectionName])

    const tempHubsCollection = db.collection<HubType>(temporaryHubCollectionName);
    const connectionsCollection = db.collection<ConnectionType>('connections');


    await gatherHubs(connectionsCollection, tempHubsCollection);

    const csv = RESULT_FILE_PATH ? new CsvWriter(RESULT_FILE_PATH, ['_id', 'hub', 'entity', 'type', 'hubclass']) : undefined;

    println('Processing hubs...')
    const hubCursor = tempHubsCollection.find({});
    while(await hubCursor.hasNext()){
        const hub = await hubCursor.next();
        if(!hub) break;

        const connections = await connectionsCollection.find({ hub: hub._id }).toArray();

        if(csv) {
            csv.writeLines(
                connections.map(c => ({
                    ...c,
                    type: c.template ? RELATIONTYPE_NAMES_BY_ID[c.template.toHexString()] : c.template,
                    hubclass: classifyHub(hub, connections) 
                }))
            );
        }
    }
    println('Hub processing done.')

    await client.close();
};

run();
