/* eslint-disable max-statements */
// Run with ts-node, explicitly passing tsconfig, and ignore the compile errors. From the project root:
// yarn ts-node --project ./tsconfig.json --transpile-only ./scripts/relationships.v2/hubStatistics.ts
import { ObjectId } from 'mongodb';

import { getClientAndDB } from './utilities/db';
import { ConnectionType } from './utilities/hubs';
import { println } from './utilities/log';

const median = (nums: number[]) => {
    nums.sort((a,b) => a - b);
    const n = nums.length;
    const half = n/2;
    if(n % 2) {
        return nums[Math.ceil(half)];
    } else {
        const left = nums[half];
        const right = nums[half+1];
        return (left + right) / 2;
    }
}

class Stats {
    name: string;
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
    median: number;
    
    constructor(name: string, data: Record<string, number>) {
        this.name = name;
        this.count = Object.keys(data).length;
        this.min = Object.values(data).reduce((a, b) => Math.min(a,b));
        this.max = Object.values(data).reduce((a, b) => Math.max(a, b));
        this.sum = Object.values(data).reduce((a, b) => a + b);
        this.avg = this.sum / this.count;
        this.median = median(Array.from(Object.values(data)));
    }

    print() {
        println(`${this.name}:`);
        println(`  hubcount: ${this.count}`);
        println(`  sum: ${this.sum}`);
        println(`  min: ${this.min}`);
        println(`  max: ${this.max}`);
        println(`  avg: ${this.avg}`);
        println(`  median: ${this.median}`);
    }
}

class Factors {
    count: number;
    sum: number;
    min: number;
    max: number;
    avg: number;
    median: number;
    name: string;
    
    constructor(name: string, base: Stats, modified: Stats) {
        this.name = name;
        this.count = modified.count / base.count;
        this.sum = modified.sum / base.sum;
        this.min = modified.min / base.min;
        this.max = modified.max / base.max;
        this.avg = modified.avg / base.avg;
        this.median = modified.median / base.median;
    }

    print() {
        println(`${this.name}:`);
        println(`  sum: ${this.sum}`);
        println(`  min: ${this.min}`);
        println(`  max: ${this.max}`);
        println(`  avg: ${this.avg}`);
        println(`  median: ${this.median}`);
    }
}

const run = async () => {
    const { client, db } = await getClientAndDB();

    const connectionsCollection = db.collection<ConnectionType>('connections');

    const hubIds = Array.from(
        new Set(
            (await connectionsCollection.find({}, { projection: { hub: 1 } }).toArray()).map( c => c.hub.toString())
        )
    ).map(hId => new ObjectId(hId));

    const connectionCounts: Record<string, number> = {};

    for (let i = 0; i < hubIds.length; i++) {
        const hId = hubIds[i];
        const connections = await connectionsCollection.find({ hub: hId}).toArray();
        connectionCounts[hId.toString()] = connections.length;
    };

    const pairCounts = Object.fromEntries(
        Object.entries(connectionCounts).map(([id, count]) => [id, count*(count-1)/2])
    );

    const connectionStats = new Stats('Current Connections', connectionCounts);
    const pairStats = new Stats('Possible Pairs', pairCounts);
    const factors = new Factors('Factors', connectionStats, pairStats);

    connectionStats.print();
    pairStats.print();
    factors.print();

    await client.close();
};

run();
