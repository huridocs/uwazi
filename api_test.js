require('babel-core/register')({stage: 0}); //babel polyfill ES6
var Jasmine = require('jasmine');
var jasmine = new Jasmine();

var db_config = require('./app/api/config/database.js');
db_config.db_url = db_config.development;

jasmine.loadConfig({
    spec_dir: 'app/api',
    spec_files: [
        '/**/*[sS]pec.js'
    ]
});

jasmine.execute();
