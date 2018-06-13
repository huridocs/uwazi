import PDFJS from 'pdfjs-dist';

import EventEmitter from 'events';
import fs from 'fs';
import path from 'path';
import logger from 'shared/logger';

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
      logger.debug('reading file', this.filepath);
      fs.readFile(this.filepath, (err, data) => {
        if (err) {
          logger.error('fs readFile error', err);
          return reject(err);
        }

        let fileData;
        try {
          fileData = new Uint8Array(data);
        } catch (error) {
          logger.error('Uint8 error', error);
          return reject(error);
        }

        logger.debug('Sending file data to PDFJS');
        PDFJS.getDocument(fileData)
        .then((pdf) => {
          const maxPages = pdf.pdfInfo.numPages;
          const pages = [];
          for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
            logger.debug('getting page', pageNumber);
            pages.push(
              pdf.getPage(pageNumber)
              .then((page) => {
                logger.debug('getting page text content', pageNumber, maxPages);
                return page.getTextContent()
                .then((text) => {
                  logger.debug('processing page text');
                  const something = `${text.items.map(s => s.str).join('').replace(/(\S+)(\s?)/g, `$1[[${Number(page.pageIndex) + 1}]]$2`)}\f`;
                  return something;
                });
              }));
          }
          Promise.all(pages).then((texts) => {
            logger.debug('All pages processed');
            resolve(texts.join(''));
          })
          .catch((error) => {
            logger.error(error);
            reject(error);
          });
        })
        .catch((error) => {
          logger.error(error);
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
