module.exports = function(grunt) {

  grunt.initConfig({
    //jshint: {
      //files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
      //options: {
        //globals: {
          //jQuery: true
        //}
      //}
    //},
    //watch: {
      //files: ['<%= jshint.files %>'],
      //tasks: ['jshint']
    //}
      karma: {
        unit: {
          configFile: 'karma.conf.js'
        }
      },
      jasmine_node: {
        default: {
          options: {
            coverage: {},
            forceExit: true,
            match: '.',
            matchAll: false,
            specFolders: ['js_server/specs'],
            extensions: 'js',
            specNameMatcher: '.spec',
            captureExceptions: true,
            junitreport: {
              report: false,
              savePath : './build/reports/jasmine/',
              useDotNotation: true,
              consolidate: true
            }
          },
          src: ['js_server/**/*.js']
        }
      }
  });

  //grunt.loadNpmTasks('grunt-contrib-jshint');
  //grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-jasmine-node-coverage');

  grunt.registerTask('default', ['karma']);
  grunt.registerTask('test_client', ['karma']);
  grunt.registerTask('test_server', ['jasmine_node']);

};
