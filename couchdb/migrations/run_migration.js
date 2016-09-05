require('babel-core/register')({
  presets: ['es2015', 'react'],
  plugins: [
    ['babel-plugin-module-alias', [
      {src: '../../app/react', expose: 'app'},
      {src: '../../app/shared', expose: 'shared'},
      {src: '../../app/api', expose: 'api'}
    ]],
    'transform-class-properties',
    'add-module-exports'
  ]
});

var db_config = require('../../app/api/config/database.js');
db_config.db_url = db_config.development;
require('./conversions_to_files.js');
