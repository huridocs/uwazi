require('dotenv').config();
require('@babel/register')({ extensions: ['.js', '.jsx', '.ts', '.tsx'] });

process.env.ROOT_PATH = process.env.ROOT_PATH || __dirname;

const file = process.argv[2];
if (file) {
  require(file);
}
