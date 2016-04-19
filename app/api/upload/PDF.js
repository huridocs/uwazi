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
  constructor(filepath) {
    super();
    this.filepath = filepath;
  }

  optimize() {
    let options = [ '-sDEVICE=pdfwrite', '-dNOPAUSE', '-dBATCH', `-sOutputFile=${generateOutputPath(this.filepath)}`, this.filepath ];
    let conversion = spawn('gs', options);

    let pages = 0;
    conversion.stdout.on('data', (data) => {
      if (data.toString().match(/Processing pages (.*) through (.*)\./)) {
        pages = RegExp.$2;
      }
      if (data.toString().match(/Page (.*)/)) {
        this.emit('progress', Math.round(RegExp.$1 * 100 / pages), parseInt(RegExp.$1, 10));
      }
    });

    return new Promise((resolve, reject) => {
      conversion.stdout.on('close', () => {
        this.optimizedPath = generateOutputPath(this.filepath);
        resolve(this.optimizedPath);
      });
      conversion.stderr.on('data', (error) => reject(error));
    });
  }

  extractText() {
    let tmpPath = `/tmp/${basename(this.filepath)}`;
    let options = ['text', `-o /tmp/${tmpPath}`, this.filepath];
    let extraction = spawn('docsplit', options);

    return new Promise((resolve, reject) => {
      extraction.stderr.on('data', (error) => reject(error));
      extraction.stdout.on('close', () => {
        fs.readFile(tmpPath, 'utf-8', (err, content) => {
          resolve(content);
        });
      });
    });
  }
}
