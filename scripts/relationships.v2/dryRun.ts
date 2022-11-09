/* eslint-disable no-await-in-loop */
/* eslint-disable max-statements */
// Run with ts-node, explicitly passing tsconfig, and ignore the compile errors. From the project root:
// yarn ts-node --project ./tsconfig.json --transpile-only ./scripts/relationships.v2/dryRun.ts <required-path-to-definition-file> <optional-path-to-result-file>
import fs from 'fs'
import process from 'process';

import _ from 'lodash';
import { Collection, Db, ObjectId } from 'mongodb';

import { objectIndex } from '../../app/shared/data_utils/objectIndex';
import { CsvWriter } from './utilities/csv';
import { createTempCollections, finalize, getClientAndDB } from './utilities/db'
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

type ConnectionType = RawConnectionType & { entityTemplateId: ObjectId, entityTitle: string, transformable?: boolean};

enum ConnectionDirections {
    in = 'in',
    out = 'out',
}

const anyTemplateString = '*';
type anyTemplateStringType = '*';
type templateInputType = anyTemplateStringType | string[];

class ConnectionInfo {
    from: templateInputType;
    through: templateInputType;
    to: templateInputType;
    constructor(from: templateInputType, through: templateInputType, direction: string, to: templateInputType) {
        this.from = from;
        this.through = through;
        this.to = to;
        if(direction == ConnectionDirections.in){
            const temp = this.from;
            this.from = this.to;
            this.to = temp;
        }
    }

    get hashableString(){
        return `from: ${JSON.stringify(this.from)} - through: ${JSON.stringify(this.through)} - to: ${JSON.stringify(this.to)}`;
    }

    getCopyWithIds(){
        return new ConnectionInfo(
            this.from === anyTemplateString ? this.from : this.from.map(name => TEMPLATE_IDS_BY_NAME[name]),
            this.through === anyTemplateString ? this.through : this.through.map(name => RELATIONTYPE_IDS_BY_NAME[name]),
            ConnectionDirections.out,
            this.to === anyTemplateString ? this.to : this.to.map(name => TEMPLATE_IDS_BY_NAME[name])
        )
    }
}

class Connection {
    named: ConnectionInfo;
    withIds: ConnectionInfo;

    constructor(from: templateInputType, through: templateInputType, direction: string, to: templateInputType) {
        this.named = new ConnectionInfo(from, through, direction, to);
        this.withIds = this.named.getCopyWithIds();
        this.nullCheck();
    }

    nullCheck() {
        const checkArray = (checkable: templateInputType) => {
            if (checkable !== anyTemplateString && checkable.filter(c => !c).length) {
                throw new Error(
                    `There is a null/undefined type or template in a connection:\n${JSON.stringify(this.named)}\n${JSON.stringify(this.withIds)}`
                    )
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

type ConnectionMatcherType = { 
    [k: string]: {
        [k: string]: Set<string>;
    }
};

const collateNodeConnections = (node: any, resultArray: Connection[]) => {
    if(!node.traverse) return;
    node.traverse.forEach(edge => {
        if(!edge.match) throw new Error('Edge needs a match clause.');
        const targetTemplates = edge.match.map(node => node.templates);
        let connection = new Connection(
            node.templates,
            edge.types,
            edge.direction,
            targetTemplates.some(t => t === anyTemplateString) ? anyTemplateString : targetTemplates.flat(),
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

    const matcher: ConnectionMatcherType = {};
    uniqueConnections.forEach(c => {
        const from = c.withIds.from === anyTemplateString ? [anyTemplateString] : c.withIds.from;
        const through = c.withIds.through === anyTemplateString? [anyTemplateString] : c.withIds.through;
        const to = c.withIds.to === anyTemplateString? [anyTemplateString] : c.withIds.to;
        from.forEach(fromTemplate => {
            if(!(fromTemplate in matcher)) matcher[fromTemplate] = {};
            const fromDict = matcher[fromTemplate];
            through.forEach(throughTemplate => {
                if(!(throughTemplate in fromDict)) fromDict[throughTemplate] = new Set();
                const throughSet = fromDict[throughTemplate];
                to.forEach(toTemplate => throughSet.add(toTemplate));
            });
        });
    });

    return {matcher, uniqueConnections};
};

const NO_CLASS_MARKER = 'NO_CLASS'

enum HubClasses {
    ONE_TO_ONE = 'ONE_TO_ONE',
    NO_UNTYPED_EDGE = 'NO_UNTYPED_EDGE',
    ALL_SAME_TYPE = 'ALL_SAME_TYPE',
    ONE_OUTLIER = 'ONE_OUTLIER',
    ONE_UNTYPED_EDGE = 'ONE_UNTYPED_EDGE',
    '2+UNTYPED_EDGES' = '2+UNTYPED_EDGES',
    EXACT_UNTYPED_COPIES = 'EXACT_UNTYPED_COPIES'
}

const transformableClasses: Set<string> = new Set([
    HubClasses.ONE_UNTYPED_EDGE, 
    `${HubClasses['2+UNTYPED_EDGES']} ${HubClasses['EXACT_UNTYPED_COPIES']}`
])

const connectionsAreEqual = (a: ConnectionType, b: ConnectionType) =>
    a.entity === b.entity && a.hub.toHexString() === b.hub.toHexString() && a.template?.toHexString() === b.template?.toHexString()

const matcherHas = (matcher: ConnectionMatcherType, from: string, through: string, to: string): boolean => {
    const froms: {
        [k: string]: Set<string>
    }[] = [];
    if(from in matcher) froms.push(matcher[from]);
    if(anyTemplateString in matcher) froms.push(matcher[anyTemplateString]);
    if(!froms.length) return false;
    const toSet = new Set<string>();
    froms.forEach(fromDict => {
        if(through in fromDict) Array.from(fromDict[through]).forEach(toTemplate => toSet.add(toTemplate));
        if(anyTemplateString in fromDict) Array.from(fromDict[anyTemplateString]).forEach(toTemplate => toSet.add(toTemplate));
    });
    return toSet.has(to) || toSet.has(anyTemplateString);
}

const classifyHub = (hub: HubType, connections: ConnectionType[], matcher: ConnectionMatcherType) => {
    const classes: string[] = [];
    const untyped_count = connections.filter(c => !c.template).length;
    const groups = _.groupBy(connections, c => c.template?.toHexString());
    const groupCounts = Object.fromEntries(Object.entries(groups).map(([template, group]) => [template, group.length]));
    const typeCount = Object.values(groups).length;
    connections.forEach(c => {
        c.transformable = false;
    });
    if(untyped_count === 0) {
        classes.push(HubClasses.NO_UNTYPED_EDGE);
        if(typeCount === 1) classes.push(HubClasses.ALL_SAME_TYPE);
        if(connections.length === 2) { 
            classes.push(HubClasses.ONE_TO_ONE);
            const first = connections[0];
            const second = connections[1];
            first.transformable = matcherHas(matcher, second.entityTemplateId.toString(), first.template.toString(), first.entityTemplateId.toString());
            second.transformable = matcherHas(matcher, first.entityTemplateId.toString(), second.template.toString(), second.entityTemplateId.toString());
        } else if (typeCount === 2 && Object.values(groupCounts).some(v => v === 1)){
            classes.push(HubClasses.ONE_OUTLIER);
            const outlierType = Object.entries(groupCounts).find(c => c[1] === 1)![0];
            const outlier = connections.find(c => c.template.toHexString() === outlierType)!;      
            connections.filter(c => c._id != outlier._id).forEach(c => {
                c.transformable = matcherHas(
                    matcher,
                    outlier.entityTemplateId.toHexString(),
                    c.template.toHexString(),
                    c.entityTemplateId.toHexString()
                );
            });
        }
    } else if(untyped_count === 1) {
        classes.push(HubClasses.ONE_UNTYPED_EDGE);
    } else if(untyped_count >= 2) {
        classes.push(HubClasses['2+UNTYPED_EDGES']);
        if(connections.length === 2) classes.push(HubClasses.ONE_TO_ONE)
        const untypedConnections = connections.filter(c => !c.template)
        if(untypedConnections.every(c => connectionsAreEqual(c, untypedConnections[0]))) {
            classes.push(HubClasses.EXACT_UNTYPED_COPIES);
        };
    };
    const finalClass = classes.join(' ');
    const hubTransformable = transformableClasses.has(finalClass);
    connections.forEach(c => {
        c.transformable = c.transformable || hubTransformable;
    })
    return {hubclass: finalClass, transformable: hubTransformable};
}

const classifyHubs = async (
    tempHubsCollection: Collection<HubType>,
    connectionsCollection: Collection<RawConnectionType>,
    matcher: ConnectionMatcherType,
    csv?: CsvWriter,
) => {
    const hubCursor = tempHubsCollection.find({});
    const transformableCount: Record<string, number> = {}
    const nonTransformableCount: Record<string, number> = {}
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

        const {hubclass, transformable } = classifyHub(hub, connections, matcher);
        if(csv) {
            csv.writeLines(
                connections.map(c => {
                    if(c.transformable) {
                        if(!(hubclass in transformableCount)) transformableCount[hubclass] = 0;
                        transformableCount[hubclass]++;
                    } else {
                        if(!(hubclass in nonTransformableCount)) nonTransformableCount[hubclass] = 0;
                        nonTransformableCount[hubclass]++;
                    }
                    return {
                        ...c,
                        entityTitle: `"${c.entityTitle}"`,
                        entityTemplate: TEMPLATE_NAMES_BY_ID[c.entityTemplateId.toHexString()],
                        relationType: c.template ? RELATIONTYPE_NAMES_BY_ID[c.template.toHexString()] : c.template,
                        hubclass,
                    }
                })
            );
        }
    }
    return { transformableCount, nonTransformableCount };
};

const printCountSet = (counts: Record<string, number>) => {
    Object.entries(counts).sort((a,b) => a[0].localeCompare(b[0])).forEach(([name, n]) =>{
        println(`     ${name}: ${n}`);
    });
};

const printSummary = (
    transformableCount: Record<string, number>,
    nonTransformableCount: Record<string, number>
    ) => {
        const transformableTotal = Object.values(transformableCount).reduce((sum, n) => sum + n, 0);
        const nonTransformableTotal = Object.values(nonTransformableCount).reduce((sum, n) => sum + n, 0);
        const total = transformableTotal + nonTransformableTotal;
        println('Summary:----------------------------');
        println(`Total: ${total}`);
        println(`Transformable: ${transformableTotal}`);
        printCountSet(transformableCount);
        println(`Not Transformable: ${nonTransformableTotal}`);
        printCountSet(nonTransformableCount);
};


const run = async () => {
    const {client, db} = await getClientAndDB();
    
    await readTypes(db);
    const rawDefinitions: any = readJsonFile(DEFINITION_FILE_PATH);    
    const {matcher, uniqueConnections: connections} = collateConnections(rawDefinitions);

    await createTempCollections(db, [temporaryHubCollectionName])

    const tempHubsCollection = db.collection<HubType>(temporaryHubCollectionName);
    const connectionsCollection = db.collection<RawConnectionType>('connections');

    await gatherHubs(connectionsCollection, tempHubsCollection);

    const csv = RESULT_FILE_PATH
        ? new CsvWriter(
            RESULT_FILE_PATH,
            ['_id', 'hub', 'entity', 'entityTitle', 'entityTemplate', 'relationType', 'hubclass', 'transformable'],
        ) : undefined;

    println('Processing hubs...')
    const { transformableCount, nonTransformableCount } = await classifyHubs(tempHubsCollection, connectionsCollection, matcher, csv);
    println('Hub processing done.')

    printSummary(transformableCount, nonTransformableCount);

    await finalize(db, [], [tempHubsCollection])

    await client.close();
    csv?.close();
};

run();
