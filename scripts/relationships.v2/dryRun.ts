/* eslint-disable no-await-in-loop */
/* eslint-disable max-statements */
// Run with ts-node, explicitly passing tsconfig, and ignore the compile errors. From the project root:
// yarn ts-node --project ./tsconfig.json --transpile-only ./scripts/relationships.v2/dryRun.ts <required-path-to-definition-file> <optional-path-to-result-file>
import fs from 'fs'
import process from 'process';

import { Db, ObjectId } from 'mongodb';

import { objectIndex } from '../../app/shared/data_utils/objectIndex';
import { CsvWriter } from './utilities/csv';
import { createTempCollections, getClientAndDB } from './utilities/db'
import { ConnectionType as RawConnectionType, gatherHubs, HubType } from './utilities/hubs';
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
let TEMPLATE_NAMES_BY_ID: Record<string, string> = {};
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
    TEMPLATE_NAMES_BY_ID = Object.fromEntries(Object.entries(TEMPLATE_IDS_BY_NAME).map(([name, id]) => [id, name]));
};

type ConnectionType = RawConnectionType & { entityTemplateId: ObjectId };

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
    NO_UNTYPED_EDGE = 'NO_UNTYPED_EDGE',
    ONE_UNTYPED_EDGE = 'ONE_UNTYPED_EDGE',
    '2+UNTYPED_EDGES' = '2+UNTYPED_EDGES'
}

const classifyHub = (hub: HubType, connections: ConnectionType[]) => {
    const untyped_count = connections.filter(c => !c.template).length;
    if(untyped_count === 0) return HubClasses.NO_UNTYPED_EDGE;
    if(untyped_count === 1) return HubClasses.ONE_UNTYPED_EDGE;
    if(untyped_count >= 2) return HubClasses['2+UNTYPED_EDGES'];
    return NO_CLASS_MARKER;
}

const run = async () => {
    const {client, db} = await getClientAndDB();
    
    await readTypes(db);
    const rawDefinitions: any = readJsonFile(DEFINITION_FILE_PATH);    
    const connections = collateConnections(rawDefinitions);

    await createTempCollections(db, [temporaryHubCollectionName])

    const tempHubsCollection = db.collection<HubType>(temporaryHubCollectionName);
    const connectionsCollection = db.collection<RawConnectionType>('connections');


    await gatherHubs(connectionsCollection, tempHubsCollection);

    const csv = RESULT_FILE_PATH
        ? new CsvWriter(
            RESULT_FILE_PATH,
            ['_id', 'hub', 'entity', 'entityTitle', 'entityTemplate', 'relationType', 'hubclass', 'transformable']
        ) : undefined;

    println('Processing hubs...')
    const hubCursor = tempHubsCollection.find({});
    const classCount = {
        [HubClasses.NO_UNTYPED_EDGE]: 0,
        [HubClasses.ONE_UNTYPED_EDGE]: 0,
        [HubClasses['2+UNTYPED_EDGES']]: 0,
        [NO_CLASS_MARKER]: 0
    }
    while(await hubCursor.hasNext()){
        const hub = await hubCursor.next();
        if(!hub) break;

        const connections = await connectionsCollection.aggregate<ConnectionType>([
        {
            $match: { hub: hub._id }
        },
        {
            $lookup: {
                from: 'entities',
                localField: 'entity',
                foreignField: 'sharedId',
                as: 'entityInfo'
            }
        },
        {
            $set: {
                pickedEntity: { $arrayElemAt: ['$entityInfo', 0] }
            }
        },
        {
            $set: {
                entityTemplateId: '$pickedEntity.template',
                entityTitle: '$pickedEntity.title'
            }
        },
        {
            $unset: ['entityInfo', 'pickedEntity']
        }
        ]).toArray();

        if(csv) {
            csv.writeLines(
                connections.map(c => {
                    const hubclass = classifyHub(hub, connections);
                    const transformable = hubclass === HubClasses.ONE_UNTYPED_EDGE;
                    classCount[hubclass]++;
                    return {
                        ...c,
                        entityTemplate: TEMPLATE_NAMES_BY_ID[c.entityTemplateId.toHexString()],
                        relationType: c.template ? RELATIONTYPE_NAMES_BY_ID[c.template.toHexString()] : c.template,
                        hubclass,
                        transformable
                    }
                })
            );
        }
    }
    println('Hub processing done.')

    const total = Object.values(classCount).reduce((sum, n) => sum + n);
    println('Summary:----------------------------');
    println(`Total: ${total}`);
    println(`Transformable (${HubClasses.ONE_UNTYPED_EDGE}): ${classCount[HubClasses.ONE_UNTYPED_EDGE]}`);
    println(`Not Transformable: ${ total - classCount[HubClasses.ONE_UNTYPED_EDGE]}`);
    println(`     ${HubClasses.NO_UNTYPED_EDGE}: ${classCount[HubClasses.NO_UNTYPED_EDGE]}`);
    println(`     ${HubClasses['2+UNTYPED_EDGES']}: ${classCount[HubClasses['2+UNTYPED_EDGES']]}`);
    println(`     ${NO_CLASS_MARKER}: ${classCount[NO_CLASS_MARKER]}`);

    await client.close();
    csv?.close();
};

run();
