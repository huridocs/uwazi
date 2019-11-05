require('@babel/register')({ extensions: ['.js', '.jsx', '.ts', '.tsx'] });

process.env.ROOT_PATH = process.env.ROOT_PATH || __dirname;

const fs = require('fs');
if (process.argv[2]) {
  const script = process.argv[2];
  if (!fs.existsSync(script)) {
    throw new Error(`Script ${process.argv[2]} does not exist !!`);
  }
  require(script);
}
