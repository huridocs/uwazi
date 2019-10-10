//import fs = require('fs');
import * as fs from 'fs';
import * as util from 'util';
let exists = util.promisify(fs.stat);

let main = async () => {
  console.log(await exists('/tmp/a').catch(e => {return "E " + e;}));    
}

(async () => {
     await main();
})().catch(e => {console.log("Error", e);});
