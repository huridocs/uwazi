import {spawn} from 'child_process';
import path from 'path';
import EventEmitter from 'events';

let generateOutputPath = (filepath) => {
  let directory = path.dirname(filepath);
  let baseName = path.basename(filepath, path.extname(filepath));
  return `${directory}/${baseName}.optimized${path.extname(filepath)}`;
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
      if (data.toString().match(/Processing pages (.*) through (.*)\./) ) {
        pages = RegExp.$2;
      }
      if (data.toString().match(/Page (.*)/) ) {
        this.emit('progress', (Math.round(RegExp.$1*100/pages)), parseInt(RegExp.$1));
      }
    });

    return new Promise((resolve, reject) => {
      conversion.stdout.on('close', () => resolve(generateOutputPath(this.filepath)));
      conversion.stderr.on('data', (error) => reject(error));
    });
  }
}
