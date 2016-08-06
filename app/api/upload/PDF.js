import {spawn} from 'child_process';
import path from 'path';
import EventEmitter from 'events';
import fs from 'fs';
import Pdftohtml from 'pdftohtmljs_uwazi';
import readMultipleFiles from 'read-multiple-files';

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
    let tmpPath = '/tmp/' + Date.now() + 'docsplit/';
    let options = ['text', '-o', tmpPath, this.filepath];
    let extraction = spawn('docsplit', options);

    return new Promise((resolve, reject) => {
      extraction.stderr.on('data', (error) => reject(error));
      extraction.stdout.on('close', () => {
        fs.readFile(tmpPath + basename(this.filepath) + '.txt', 'utf-8', (err, content) => {
          resolve(content);
        });
      });
    });
  }

  toHTML() {
    let destination = '/tmp/' + Date.now() + '/';
    let converter = new Pdftohtml(this.optimizedPath);
    converter.add_options([
      '--dest-dir ' + destination,
      '--split-pages 1',
      '--embed-css 0',
      '--page-filename %d',
      '--css-filename custom.css',
      '--optimize-text 1',
      '--tounicode 1',
      '--decompose-ligature 1',
      '--hdpi 96',
      '--vdpi 96',
      '--bg-format jpg']);

    return converter.convert()
    .then(() => {
      return new Promise((resolve) => {
        fs.readdir(destination, (err, filenames) => {
          let orderedPageFiles = filenames
          .filter((filename) => !filename.match(/\.html/) && parseInt(filename, 10))
          .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
          .map((file) => destination + file);

          let conversion = {};

          readMultipleFiles(orderedPageFiles, 'utf8', (error, pages) => {
            fs.readFile(destination + 'custom.css', 'utf8', (cssError, css) => {
              conversion.css = css.split('\n').filter((line) => !line.match('@font-face')).join('\n');
              conversion.fonts = css.split('\n').filter((line) => line.match('@font-face')).join('\n');
              conversion.pages = pages;
              resolve(conversion);
            });
          });
        });
      });
    });
  }

  convert() {
    return this.optimize()
    .then(() => {
      return Promise.all([
        this.toHTML(),
        this.extractText()
      ]);
    })
    .catch(() => {
      return Promise.reject({error: 'conversion_error'});
    })
    .then((conversion) => {
      let result = conversion[0];
      result.fullText = conversion[1];
      return result;
    });
  }
}
