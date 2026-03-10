/* eslint-disable max-statements,no-eval,node/no-restricted-import,no-console */
import { config } from 'api/config';
import fs from 'fs';
import path from 'path';
import index from 'api/migrations/migrations/17-metadata-structured-object';

function walk(dir: string, callback: (file: string, stats: fs.Stats) => void) {
  fs.readdir(dir, (err, files) => {
    if (err) throw err;
    files.forEach(file => {
      const filepath = path.join(dir, file);
      fs.stat(filepath, (err2, stats) => {
        if (err2) throw err2;
        if (stats.isDirectory()) {
          walk(filepath, callback);
        } else if (stats.isFile()) {
          callback(filepath, stats);
        }
      });
    });
  });
}

function extractBracketLength(contents: string, pos: number): number {
  if (contents[pos] !== '{') {
    throw new Error('bad call to extractJson!');
  }
  let numBracket = 1;
  let endPos = pos + 1;
  for (; numBracket > 0; endPos += 1) {
    if (contents[endPos] === '{') {
      numBracket += 1;
    } else if (contents[endPos] === '}') {
      numBracket -= 1;
    }
  }
  return endPos - pos;
}

function handleFile(file: string, _stats: fs.Stats): void {
  if (/.*migrations.*/.test(file) || !/.*js/.test(file)) {
    return;
  }
  let contents = fs.readFileSync(file, 'utf8');
  let pos = 0;
  let changed = false;
  while (pos >= 0) {
    pos = contents.indexOf('metadata: {', pos);
    if (pos < 0) {
      break;
    }
    pos += 10;
    const len = extractBracketLength(contents, pos);
    if (len > 2) {
      try {
        const data = eval(`(${contents.substr(pos, len)})`);
        const newStr = JSON.stringify(index.expandMetadata(data));
        console.info(`Match in ${file} at ${pos}: ${newStr}`);
        contents = contents.substr(0, pos) + newStr + contents.substr(pos + len);
        changed = true;
      } catch (err) {
        console.error(
          `Could not parse match in ${file} at ${pos} - ${err}: ${contents.substr(pos, len)}`
        );
      }
    }
  }
  if (changed) {
    if (contents.indexOf('@format') < 0) {
      contents = `/** @format */\n\n${contents}`;
    }
    fs.writeFileSync(`${file}`, contents);
  }
}

walk(path.join(config.rootPath, '/app'), handleFile);
