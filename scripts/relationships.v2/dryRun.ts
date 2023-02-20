/* eslint-disable no-await-in-loop */
/* eslint-disable max-statements */
// Run with ts-node, explicitly passing tsconfig, and ignore the compile errors. From the project root:
// yarn ts-node --project ./tsconfig.json --transpile-only ./scripts/relationships.v2/dryRun.ts <required-path-to-definition-file> <optional-path-to-result-file>
import fs from 'fs'
import process from 'process';
import readline from 'readline';

import _ from 'lodash';
import { Collection, Db, } from 'mongodb';

import { RelationshipDBOType } from '../../app/api/relationships.v2/database/schemas/relationshipTypes'
import { CsvWriter } from './utilities/csv';
import { anyTemplateString, ConnectionDescriptor, getEntityTemplateName, getRelationTypeTemplateName, readTypes } from './utilities/connection_descriptors';
import { createTempCollections, finalize, getClientAndDB } from './utilities/db'
import { ConnectionType, ConnectionType as RawConnectionType, ConnectionWithEntityInfoType, countRelTypeGroups, gatherHubs, getConnectionsFromHub, HubType } from './utilities/hubs';
import { println } from './utilities/log';
import { BulkWriteStream } from '../../app/api/common.v2/database/BulkWriteStream';
import { propertyTypes } from '../../app/shared/propertyTypes';
import { TemplateSchema } from '../../app/shared/types/templateType';



const inputreader = readline.createInterface({ input: process.stdin, output: process.stdout });
const prompt = (query: string) => new Promise((resolve) => inputreader.question(query, resolve));

const batchsize = 1000;

enum CheckTypes {
    assumptions = 'assumptions', // use the assumptions based on the Cejil dataset
    full = 'full' // cross-check every possible connection to a hub and try to match it to the given input graph
}

enum DefinitionSources {
    file = 'file', // the input graph comes from a file
    fields = 'fields' // the input graph is derived from the relationship fields in the db
}

const DEFINITION_FILE_PATH = process.argv.length > 2 ? process.argv[2] : undefined;
const RESULT_FILE_PATH = process.argv.length > 3 ? process.argv[3] : undefined;
const CHECK_TYPE = process.argv.length > 4 ? process.argv[4] : undefined;
const DEFINITION_SOURCE = process.argv.length > 5 ? process.argv[5] : undefined;

const USE_FULL_CROSSCHECK = CHECK_TYPE == CheckTypes.full;

const temporaryHubCollectionName = '__temporary_hub_collection';
const temporaryNewRelationshipsCollectionName = '__temporary_new_relationships';


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

type ConnectionMatcherType = { 
    [k: string]: {
        [k: string]: Set<string>;
    }
};

const collateNodeConnections = (node: any, resultArray: ConnectionDescriptor[]) => {
    if(!node.traverse) return;
    node.traverse.forEach(edge => {
        if(!edge.match) throw new Error('Edge needs a match clause.');
        const targetTemplates = edge.match.map(node => node.templates);
        let connection = new ConnectionDescriptor(
            node.templates,
            edge.types,
            edge.direction,
            targetTemplates.some(t => t === anyTemplateString) ? anyTemplateString : targetTemplates.flat(),
        )
        resultArray.push(connection);
        edge.match.forEach(node => collateNodeConnections(node, resultArray));
    });
};

const buildMatcher = (connections: ConnectionDescriptor[]) => {
    const matcher: ConnectionMatcherType = {};
    connections.forEach(c => {
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
    return matcher;
};

let FORWARD_MATCHER: ConnectionMatcherType = {};
let PARTIAL_BACK_MATCHER: ConnectionMatcherType = {};

const preProcessConnectionDescriptors = (connections: ConnectionDescriptor[]): ConnectionDescriptor[] => {
    const uniqueConnections: ConnectionDescriptor[] = [];
    const hashSet = new Set();

    connections.forEach(c => {
        if(!hashSet.has(c.hashableString)) {
            hashSet.add(c.hashableString);
            uniqueConnections.push(c);
        }
    });

    FORWARD_MATCHER = buildMatcher(connections);
    PARTIAL_BACK_MATCHER = buildMatcher(
        connections.map(c => new ConnectionDescriptor(c.named.to, c.named.through, 'out', '*'))
    );

    return uniqueConnections;
}

const NO_CLASS_MARKER = 'NO_CLASS'

enum HubClasses {
    ONE_TO_ONE = 'ONE_TO_ONE',
    NO_UNTYPED_EDGE = 'NO_UNTYPED_EDGE',
    ALL_SAME_TYPE = 'ALL_SAME_TYPE',
    ALL_SAME_ENTITY_TEMPLATE = 'ALL_SAME_ENTITY_TEMPLATE',
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

const matcherHas = (matcher: ConnectionMatcherType, from: string, through: string, to: string, shallow: boolean = false ): boolean => {
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
    if(shallow) return !!toSet.size;
    return toSet.has(to) || toSet.has(anyTemplateString);
}

const fullMatch = (matcher: ConnectionMatcherType, from: string, through: string, to: string ): boolean =>
    matcherHas(matcher, from, through, to, false);

const fullForwardMatch = (from: string, through: string, to: string): boolean =>
    fullMatch(FORWARD_MATCHER, from, through, to)

const partialMatch = (matcher: ConnectionMatcherType, from: string, through: string ): boolean =>
    matcherHas(matcher, from, through, '', true);

const partialBackMatch = (from: string, through: string): boolean =>
    partialMatch(PARTIAL_BACK_MATCHER, from, through)

const pairMatches = (first: ConnectionWithEntityInfoType, second: ConnectionWithEntityInfoType): boolean => {
    return !!second.template && fullForwardMatch(
        first.entityTemplateId.toString(),
        second.template.toString(),
        second.entityTemplateId.toString()
    );
};

const matchPairs = (sources: ConnectionWithEntityInfoType[], targets: ConnectionWithEntityInfoType[]) => {
    sources.forEach(first => {
        targets.forEach(second => {
            const transformable = pairMatches(first, second);
            first.transformable = first.transformable || transformable;
            second.transformable = second.transformable || transformable;
        });
    });
};

const selectOutlier = (connections: ConnectionWithEntityInfoType[], groupCounts: Record<string, number>) => {
    const outlierType = Object.entries(groupCounts).find(c => c[1] === 1)![0];
    const [outlier, rest] = _.partition(connections, c => c.template.toHexString() === outlierType);
    return {outlier, rest};

};

const fullCrossCheck = (connections: ConnectionWithEntityInfoType[]) => {
    matchPairs(connections, connections);
    return {hubclass: NO_CLASS_MARKER, transformable: undefined};
};

const classifyHub = (hub: HubType, connections: ConnectionWithEntityInfoType[], ) => {
    if(USE_FULL_CROSSCHECK) return fullCrossCheck(connections);
    const classes: string[] = [];
    const untyped_count = connections.filter(c => !c.template).length;
    const { groups, groupCounts } = countRelTypeGroups(connections);
    const typeCount = Object.values(groups).length;
    const entityTemplateCount = new Set(connections.map(c => c.entityTemplateId.toString())).size;
    connections.forEach(c => {
        c.transformable = false;
    });
    if(untyped_count === 0) {
        classes.push(HubClasses.NO_UNTYPED_EDGE);
        if(typeCount === 1) {
            classes.push(HubClasses.ALL_SAME_TYPE);
            if(entityTemplateCount == 1) classes.push(HubClasses.ALL_SAME_ENTITY_TEMPLATE);
            const [onlyTargets, sourceCandidates] = _.partition(
                    connections,
                    c => partialBackMatch(c.entityTemplateId.toString(), c.template.toString())
                )
                matchPairs(sourceCandidates, onlyTargets);            
        } 
        if(connections.length === 2) { 
            classes.push(HubClasses.ONE_TO_ONE);
            const first = connections[0];
            const second = connections[1];
            const first_transformable = fullForwardMatch(second.entityTemplateId.toString(), first.template.toString(), first.entityTemplateId.toString());
            const second_transformable = fullForwardMatch(first.entityTemplateId.toString(), second.template.toString(), second.entityTemplateId.toString());
            first.transformable = first_transformable || second_transformable;
            second.transformable = first.transformable;
        } else if (typeCount === 2 && Object.values(groupCounts).some(v => v === 1)){
            classes.push(HubClasses.ONE_OUTLIER);
            const { outlier, rest } = selectOutlier(connections, groupCounts);
            matchPairs(outlier, rest);

        }
    } else if(untyped_count === 1) {
        classes.push(HubClasses.ONE_UNTYPED_EDGE);
    } else if(untyped_count >= 2) {
        classes.push(HubClasses['2+UNTYPED_EDGES']);
        if(connections.length === 2) classes.push(HubClasses.ONE_TO_ONE)
        const [typedConnections, untypedConnections] = _.partition(connections, c => c.template);
        if(untypedConnections.every(c => connectionsAreEqual(c, untypedConnections[0]))) {
            classes.push(HubClasses.EXACT_UNTYPED_COPIES);
        } else {
            matchPairs(untypedConnections, typedConnections);
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
    csv?: CsvWriter,
) => {
    const hubCursor = tempHubsCollection.find();
    const transformableCount: Record<string, number> = {}
    const nonTransformableCount: Record<string, number> = {}
    while(await hubCursor.hasNext()){
        const hub = await hubCursor.next();
        if(!hub) break;

        const connections = await getConnectionsFromHub(hub, connectionsCollection);

        const { hubclass } = classifyHub(hub, connections);
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
                        entityTemplate: getEntityTemplateName(c.entityTemplateId.toString()),
                        relationType: c.template ? getRelationTypeTemplateName(c.template.toString()) : c.template,
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

const transformThroughUntypedOutlier = (connections: ConnectionType[]) => {
    //c.transformable automatically true
    const untyped = connections.find(c => !c.template);
    const typed = connections.filter(c => c.template);
    if(!untyped) return [];
    const from = {entity: untyped.entity};        
    return typed.map(c => ({ from, to: {entity: c.entity}, type: c.template }))
};

const transformMatchingPairs = (sources: ConnectionWithEntityInfoType[], targets: ConnectionWithEntityInfoType[]) => {
    const transformed: Omit<RelationshipDBOType, '_id'>[] = [];
    sources.forEach(first => {
        targets.forEach(second => {
            const transformable = pairMatches(first, second);
            if(transformable) transformed.push({ from: {entity: first.entity}, to: {entity: second.entity}, type: second.template});
        });
    });
    return transformed;
}

const fullCrossTransform = (connections: ConnectionWithEntityInfoType[]) => {
    return transformMatchingPairs(connections, connections);
};

const transformThroughTypedOutlier = (connections: ConnectionWithEntityInfoType[]) => {
    const { groupCounts } = countRelTypeGroups(connections);
    const { outlier, rest } = selectOutlier(connections, groupCounts);
    return transformMatchingPairs(outlier, rest);
}

const transformBySeparatingUntyped = (connections: ConnectionWithEntityInfoType[]) => {
    const [typedConnections, untypedConnections] = _.partition(connections, c => c.template);
    return transformMatchingPairs(untypedConnections, typedConnections);
}

const transformOneToOne = (connections: ConnectionWithEntityInfoType[]) => {
    const first = connections[0];
    const second = connections[1];

    return [
        ...transformMatchingPairs([first],[second]),
        ...transformMatchingPairs([second], [first])
    ];
};

type HubTransformerType = (connections: ConnectionWithEntityInfoType[]) => Omit<RelationshipDBOType, '_id'>[];
const HUBTRANSFORMERS: Record<string, HubTransformerType> = {
    // [`${HubClasses.ONE_UNTYPED_EDGE}`]: transformThroughUntypedOutlier,
    // [`${HubClasses['2+UNTYPED_EDGES']}`]: transformBySeparatingUntyped,
    // [`${HubClasses['2+UNTYPED_EDGES']} ${HubClasses['EXACT_UNTYPED_COPIES']}`]: transformThroughUntypedOutlier,
    // [`${HubClasses.NO_UNTYPED_EDGE} ${HubClasses.ALL_SAME_TYPE}`]: ...
    // [`${HubClasses.NO_UNTYPED_EDGE} ${HubClasses.ALL_SAME_TYPE} ${HubClasses.ONE_TO_ONE}`]: transformOneToOne,
    // [`${HubClasses.NO_UNTYPED_EDGE} ${HubClasses.ONE_OUTLIER}`]: transformThroughTypedOutlier,
    // [`${HubClasses.NO_UNTYPED_EDGE} ${HubClasses.ONE_TO_ONE}`]: transformOneToOne,
    [`${NO_CLASS_MARKER}`]: fullCrossTransform,
};

const transformHub = (hubclass: string, connections: ConnectionWithEntityInfoType[]): Omit<RelationshipDBOType, '_id'>[] => {
    if(hubclass in HUBTRANSFORMERS){
        return HUBTRANSFORMERS[hubclass](connections);
    }
    return [];
};

const transformConnections = async (
    tempHubsCollection: Collection<HubType>,
    connectionsCollection: Collection<RawConnectionType>,
    relationshipsCollection: Collection<RelationshipDBOType>,
) => {
    if (!(CHECK_TYPE === CheckTypes.full && DEFINITION_SOURCE === DefinitionSources.fields)) {
        println('Transformations only supported for full check from relationships fields.');
        return;
    }
    const stringanswer = await prompt('Perform transformations? (y/n)');
    const perform = stringanswer === 'y';
    if(!perform) return;
    const hubCursor = tempHubsCollection.find({});
    const relationshipsWriter = new BulkWriteStream(relationshipsCollection, undefined, batchsize);
    while(await hubCursor.hasNext()){
        const hub = await hubCursor.next();
        if(!hub) break;
        const connections = await getConnectionsFromHub(hub, connectionsCollection);
        const { hubclass } = classifyHub(hub, connections);
        const relationships = transformHub(hubclass, connections);
        await relationshipsWriter.insertMany(relationships);
    }
    await relationshipsWriter.flush();
};

const checkCollectionNameWithUser = async (db: Db) => {
    const site_name = (await db.collection('settings').findOne({}, { projection: { site_name: 1 } }))?.site_name;
    const stringanswer = await prompt(`The site name in settings is ${site_name}. Proceed? (y/n)`);
    const perform = stringanswer === 'y';
    if(!perform) {
        println('Stopping.');
        process.exit(0);
    };
};

const checkValueInObject = async (value: string | undefined, obj: any, name: string) => {
    if(!value || !(value in obj)) {
        println(`${value} as ${name} is unknown. Options are: ${Object.keys(obj)}`);
        process.exit(0);
    }
}

const readConnectionsFromFile = async (filepath: string) => {
    println('Reading connection descriptors from file...')
    const rawDefinitions: any = readJsonFile(filepath);    
    const connections: ConnectionDescriptor[] = [];
    rawDefinitions.forEach(node => collateNodeConnections(node, connections));
    const uniqueConnections = preProcessConnectionDescriptors(connections);
    println('Reading connection descriptors done.')
    return uniqueConnections;
};

const readConnectionsFromFields = async (db: Db) => {
    println('Reading connection descriptors from db...');
    const connections: ConnectionDescriptor[] =  [];
    const templates = await db.collection<TemplateSchema>('templates').find({}, {projection: { properties: 1 }}).toArray();
    templates.forEach(t => {
        const source = [t._id.toString()];
        (t.properties || []).filter(p => p.type === propertyTypes.relationship).forEach(p => {
            const target = p.content ? [p.content] : '*';
            const relType = [p.relationType];
            const descriptor =  new ConnectionDescriptor(source, relType, 'out', target, true);
            connections.push(descriptor);
        })
    });
    const uniqueConnections = preProcessConnectionDescriptors(connections);
    println('Reading connection descriptors done');
    return uniqueConnections;
}

const readConnections = async (filepath: string, db: Db) => {
    let connections: ConnectionDescriptor[] =  [];
    if (DEFINITION_SOURCE == DefinitionSources.file) {
        connections = await readConnectionsFromFile(filepath)
    } else if (DEFINITION_SOURCE == DefinitionSources.fields) {
        connections = await readConnectionsFromFields(db)
    }
    return connections;
}

const inputChecks = () => {
    if(!DEFINITION_FILE_PATH) {
        println('No definition file path provided.');
        process.exit(0);
    }
    checkValueInObject(CHECK_TYPE, CheckTypes, 'Check Type');
    checkValueInObject(DEFINITION_SOURCE, DefinitionSources, 'Definition Source');
    println(`Using check type: ${CHECK_TYPE}.`);
    println(`Using definition source: ${DEFINITION_SOURCE}.`);
};

const run = async () => {
    inputChecks();
    const {client, db} = await getClientAndDB();
    await checkCollectionNameWithUser(db);
    
    await readTypes(db);
    await readConnections(DEFINITION_FILE_PATH!, db);

    await createTempCollections(db, [temporaryHubCollectionName, temporaryNewRelationshipsCollectionName]);

    const tempHubsCollection = db.collection<HubType>(temporaryHubCollectionName);
    const tempRelationshipsCollection = db.collection<RelationshipDBOType>(temporaryNewRelationshipsCollectionName);
    const relationshipsCollection = db.collection<RelationshipDBOType>('relationships');
    const connectionsCollection = db.collection<RawConnectionType>('connections');

    await gatherHubs(connectionsCollection, tempHubsCollection);

    const csv = RESULT_FILE_PATH
        ? new CsvWriter(
            RESULT_FILE_PATH,
            ['_id', 'hub', 'entity', 'entityTitle', 'entityTemplate', 'relationType', 'hubclass', 'transformable'],
        ) : undefined;

    println('Classifying hubs...');
    const { transformableCount, nonTransformableCount } = await classifyHubs(tempHubsCollection, connectionsCollection, csv);
    println('Hub classification done.');

    printSummary(transformableCount, nonTransformableCount);

    println('Transforming connections...');
    await transformConnections(tempHubsCollection, connectionsCollection, tempRelationshipsCollection);
    println('Transforming connections done.');

    await finalize(db, [[tempRelationshipsCollection, relationshipsCollection]], [tempHubsCollection, tempRelationshipsCollection])

    await client.close();
    csv?.close();
    inputreader.close();
};

run();
