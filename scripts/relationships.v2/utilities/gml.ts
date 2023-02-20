import * as fs from 'fs';
import { ConnectionDescriptor } from './connection_descriptors';

const OPENER = `
graph [
	directed 1
	id 0
	label "Uwazi Relationship Type Graph"
`
const END = `
]
`

class GMLNode {
  id: number;
  label: string;

  constructor(id: number, label: string) {
    this.id = id;
    this.label = label; 
  }

  toGMLString() {
    return `node [
      id ${this.id}
      label "${this.label}"
    ]`;
  }
}

class GMLEdge {
  source: number;
  target: number;
  label: string;

  constructor(source: number, target: number, label: string) {
    this.source = source;
    this.target = target;
    this.label = label;
  }

  toGMLString() {
    return `edge [
      source ${this.source}
      target ${this.target}
      label "${this.label}"
    ]`;
  }
}

class GMLGraph {
  count: number = 0;
  nodemap: Record<string, GMLNode> = {};
  edges: GMLEdge[] = [];

  constructor(){}

  addNodeLabel(label: string) {
    if(!(label in this.nodemap)) {
      this.count++;
      this.nodemap[label] = new GMLNode(this.count, label);
    }
  }

  addNodeLabels(labels: string | string[]) {
    if(Array.isArray(labels)) {
      labels.forEach(label => this.addNodeLabel(label));
    } else {
      this.addNodeLabel(labels);
    }
  }

  addFullPairingEdges(_sources: string | string[], _targets: string | string[], _labels: string | string[]){
    const sources = Array.isArray(_sources) ? _sources : [_sources];
    const targets = Array.isArray(_targets)? _targets : [_targets];
    const labels = Array.isArray(_labels)? _labels : [_labels];
    sources.forEach(source => {
      const sourceId = this.nodemap[source].id;
      targets.forEach(target => {
        const targetId = this.nodemap[target].id;
        labels.forEach(label => {
          this.edges.push(new GMLEdge(sourceId, targetId, label));
        })
      });
    });
  }

  writeToFile(filePath: string){
    const writeStream = fs.createWriteStream(filePath);
    writeStream.write(OPENER);

    Object.values(this.nodemap).forEach(node => {
      writeStream.write(node.toGMLString());
      writeStream.write('\n');
    })
    this.edges.forEach(edge => {
      writeStream.write(edge.toGMLString());
      writeStream.write('\n');
    });


    writeStream.write(END);
    writeStream.close();
  }
}

const addDescriptorToGMLGraph = (graph: GMLGraph, descriptor: ConnectionDescriptor) => {
  const sources = descriptor.named.from;
  const targets = descriptor.named.to;
  const edgeLabels = descriptor.named.through;
  graph.addNodeLabels(sources);
  graph.addNodeLabels(targets);
  graph.addFullPairingEdges(sources, targets, edgeLabels);
};

const descriptorsToGMLGraph = (descriptors: ConnectionDescriptor[]) => {
  const graph = new GMLGraph();
  descriptors.forEach(d => addDescriptorToGMLGraph(graph, d));
  return graph;
};

const connectionDescriptorsToGML = (filePath: string, descriptors: ConnectionDescriptor[]) => { 
    const graph = descriptorsToGMLGraph(descriptors);
    graph.writeToFile(filePath);
};

export { connectionDescriptorsToGML };