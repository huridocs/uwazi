/*eslint no-console: 0*/

/* eslint import/no-extraneous-dependencies: ["error", {"peerDependencies": true}] */
import Nightmare from 'nightmare';
import nightmareUpload from 'nightmare-upload';
import realMouse from 'nightmare-real-mouse';

import './LibraryDSL.js';
import './connectionsDSL.js';
import './extensions.js';

realMouse(Nightmare);
nightmareUpload(Nightmare);
const show = !!process.argv.includes('--show') || process.env.SHOW_E2E;
export default function createNightmare(width = 1100, height = 600) {
  const nightmare = new Nightmare({
    show: true,
    typeInterval: 10,
    x: 0,
    y: 0,
    webPreferences: {
      preload: `${__dirname}/custom-preload.js`
    }
  }).viewport(width, height);

  nightmare.on('page', (type, message, error) => {
    fail(error);
  });

  nightmare.on('dom-ready', () => {
    nightmare.inject('css', `${__dirname}/tests.css`);
  });

  nightmare.on('console', (type, message) => {
    //if (message.match(/Unknown prop `storeSubscription`/)) {
    //return;
    //}
    if (type === 'error') {
      fail(message);
    }
    if (type === 'log') {
      console.log(message);
    }
  });

  return nightmare;
}
