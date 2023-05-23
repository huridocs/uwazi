// Run with ts-node, explicitly passing tsconfig, and ignore the compile errors. From the project root:
// yarn ts-node --project ./tsconfig.json --transpile-only ./scripts/relationships.v2/inferGraph.ts <gml-output-path> <optional-database-name> 
import _ from "lodash";
import { Collection } from "mongodb";

import { ConnectionDescriptor, makeRawConnectionsReadable, readTypes } from "./utilities/connection_descriptors";
import { createTempCollections, finalize, getClientAndDB } from "./utilities/db";
import { connectionDescriptorsToGML } from "./utilities/gml";
import { ConnectionType, ConnectionWithEntityInfoType, countEntityTemplateGroups, countRelTypeGroups, gatherHubs, getConnectionsFromHub, HubType } from "./utilities/hubs";
import { println } from "./utilities/log";

const GML_OUTPUT_FILE_PATH = process.argv.length > 2 ? process.argv[2] : undefined;
const DATABASE_NAME = process.argv.length > 3 ? process.argv[3] : undefined;

const temporaryHubCollectionName = '__temporary_hub_collection';


class ConnectionDescriptorSet {
    _hashMap: { [key: string]: ConnectionDescriptor } = {};
    _counts: Record<string, number> = {};

    add(descriptors: ConnectionDescriptor[]){
        descriptors.forEach(d => {
            if(!(d.hashableString in this._hashMap)) {
                this._hashMap[d.hashableString] = d;
                this._counts[d.hashableString] = 1;
            } else {
                this._counts[d.hashableString]++;
            }
        });
    }

    get readableCounts() {
        return Object.fromEntries(
            Object.entries(this._counts).map(([k, v]) => [this._hashMap[k].readableString, v])
        )
    }

    get descriptors(){
        return Object.values(this._hashMap);
    }    
}


const readConnectionDescriptorFromPairs = (source: ConnectionWithEntityInfoType, target: ConnectionWithEntityInfoType) =>
    new ConnectionDescriptor([source.entityTemplateId.toString()], [target.template.toString()], 'out', [target.entityTemplateId.toString()], true);


const readConnectionDescriptorsFromPairs = (sources: ConnectionWithEntityInfoType[], targets: ConnectionWithEntityInfoType[]) => {
    const descriptors: ConnectionDescriptor[] = [];
    sources.forEach(source => {
        targets.forEach(target => {
            descriptors.push(readConnectionDescriptorFromPairs(source, target));
        });
    });
    return descriptors;
};


const guessConnectionDescriptorsFromHub = (hub: HubType, connections: ConnectionWithEntityInfoType[]) => {
    const { groups: relTypeGroups, groupCounts: relTypeCounts } = countRelTypeGroups(connections);
    const { groups: entityTemplateGroups, groupCounts: entityTemplateCounts } = countEntityTemplateGroups(connections);
    const numberOfRelTypes = Object.values(relTypeCounts).length;
    const numberOfEntityTemplates = Object.values(entityTemplateCounts).length;

    // console.log('reltype', relTypeCounts);
    // console.log('entitytemplate', entityTemplateCounts);

    // @ts-ignore
    if(undefined in relTypeGroups) { 
        const [ undefineds, rest ] = _.partition(connections, c => !c.template);
        return readConnectionDescriptorsFromPairs(undefineds, rest);
    } 
    // else if(numberOfRelTypes > 1) {
    //     console.log(hub, makeRawConnectionsReadable(connections))
    //     console.log(relTypeCounts, entityTemplateCounts);
    // } else if (numberOfEntityTemplates > 1) {
    //     //skip for now
    // }
    // // remaining unhandled category: when everything has the same entity template and relationship type
    return [];
};


const guessConnectionDescriptors = async (
    descriptorStorage: ConnectionDescriptorSet,
    tempHubsCollection: Collection<HubType>,
    connectionsCollection: Collection<ConnectionType>
    ): Promise<void> => {
        const hubCursor = tempHubsCollection.find({});
        const descriptors: ConnectionDescriptor[][] = [];
        while(await hubCursor.hasNext()){
            const hub = await hubCursor.next();
            if(!hub) break;
            const connections =  await getConnectionsFromHub(hub, connectionsCollection);                       
            descriptorStorage.add(guessConnectionDescriptorsFromHub(hub, connections));
        }
};

const run = async () => {
    const {client, db} = await getClientAndDB(DATABASE_NAME);

    await readTypes(db);
    await createTempCollections(db, [temporaryHubCollectionName])
    const tempHubsCollection = db.collection<HubType>(temporaryHubCollectionName);
    const connectionsCollection = db.collection<ConnectionType>('connections');
    await gatherHubs(connectionsCollection, tempHubsCollection, 200);

    println('Guessing connection descriptors...');
    const connectionDescriptors = new ConnectionDescriptorSet();
    await guessConnectionDescriptors(connectionDescriptors, tempHubsCollection, connectionsCollection);
    println('Guessing connection descriptors done.');

    // console.log('connectionDescriptors', JSON.stringify(connectionDescriptors.readableCounts, null, 2));

    println('Printing graphml output...');
    if (GML_OUTPUT_FILE_PATH) connectionDescriptorsToGML(GML_OUTPUT_FILE_PATH, connectionDescriptors.descriptors);
    println('Printing graphml output done.');


    await finalize(db, [], [tempHubsCollection]);

    await client.close();
};

run();