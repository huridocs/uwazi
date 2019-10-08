fs = require('fs');
util = require('util');
let exists = util.promisify(fs.stat);

let done = () => {
  console.log('done');
}

let main = async () => {
  console.log(await exists('/tmp/a').catch(e => {return "E " + e;}));
  done();
  done.fail("error");
}

(async () => {
     await main();
})().catch(e => {console.log("Error", e);});
