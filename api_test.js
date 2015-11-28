require('babel-core/register')({stage: 0}); //babel polyfill ES6
var Jasmine = require('jasmine');
var jasmine = new Jasmine();

jasmine.loadConfig({
    spec_dir: 'app/api',
    spec_files: [
        '/**/*[sS]pec.js'
    ]
});

jasmine.execute();
