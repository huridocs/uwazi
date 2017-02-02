import {spawn} from 'child_process';
import path from 'path';
import EventEmitter from 'events';
import fs from 'fs';

let basename = (filepath) => {
  return path.basename(filepath, path.extname(filepath));
};

let generateOutputPath = (filepath) => {
  let directory = path.dirname(filepath);
  return `${directory}/${basename(filepath)}.optimized${path.extname(filepath)}`;
};

export default class PDF extends EventEmitter {
  constructor(filepath, originalName) {
    super();
    this.logFile = __dirname + '/../../../log/' + basename(originalName) + '.log';
    this.filepath = filepath;
    this.optimizedPath = filepath;
  }

  extractText() {
    let logFile = fs.createWriteStream(this.logFile, {flags: 'a'});
    let tmpPath = '/tmp/' + Date.now() + 'docsplit/';
    let options = ['text', '-o', tmpPath, this.filepath];
    let extraction = spawn('docsplit', options);
    extraction.stderr.pipe(logFile);
    extraction.stdout.pipe(logFile);

    return new Promise((resolve, reject) => {
      extraction.stdout.on('close', () => {
        fs.readFile(tmpPath + basename(this.filepath) + '.txt', 'utf-8', (err, content) => {
          if (err) {
            reject(err);
          }
          resolve(content);
        });
      });
    });
  }

  convert() {
    return this.extractText()
    .catch(() => {
      return Promise.reject({error: 'conversion_error'});
    })
    .then((fullText) => {
      return {fullText};
    });
  }
}
