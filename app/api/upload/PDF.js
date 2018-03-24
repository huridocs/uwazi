import PDFJS from 'pdfjs-dist';

import EventEmitter from 'events';
import fs from 'fs';
import path from 'path';

const basename = (filepath = '') => {
  let finalPath = filepath;
  if (typeof filepath !== 'string') {
    finalPath = '';
  }
  return path.basename(finalPath, path.extname(finalPath));
};

export default class PDF extends EventEmitter {
  constructor(filepath, originalName) {
    super();
    this.logFile = `${__dirname}/../../../log/${basename(originalName)}.log`;
    this.filepath = filepath;
    this.optimizedPath = filepath;
  }

  extractText() {
    return new Promise((resolve, reject) => {
      fs.readFile(this.filepath, (err, data) => {
        if (err) {
          return reject(err);
        }
        const fileData = new Uint8Array(data);
        PDFJS.getDocument(fileData).then((pdf) => {
          const maxPages = pdf.pdfInfo.numPages;
          const pages = [];
          for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
            pages.push(
              pdf.getPage(pageNumber)
              .then(page => page.getTextContent()
                .then(text => `${text.items.map(s => s.str).join('').replace(/(\S+)(\s?)/g, `$1[[${Number(page.pageIndex) + 1}]]$2`)}\f`)
              )
            );
          }
          Promise.all(pages).then((texts) => {
            resolve(texts.join(''));
          })
          .catch((error) => {
            reject(error);
          });
        })
        .catch((error) => {
          reject(error);
        });
      });
    });
  }

  convert() {
    return this.extractText()
    .catch(() => Promise.reject({ error: 'conversion_error' }))
    .then(fullText => ({ fullText }));
  }
}
