require('babel-core/register')();
const fs = require('fs');
if (process.argv[2]) {
  const script = process.argv[2];
  if (!fs.existsSync(script)) {
    console.log(`Script ${process.argv[2]} does not exist !!`);
    process.exit();
  }
  require(script);
}
