module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    less: {
      app: {
        files: {
          'web/assets/css/styles.css': 'web/app/main.less'
        }
      }
    },

    watch: {
      app: {
        files: 'web/app/**/*',
        tasks: ['less:app', 'concat:app']
      }
    },

    express: {
      local: {
        options: {
          script: 'bin/index.js',
          args: ['--service'],
          port: 3788
        }
      }
    },

    concat: {
      app: {
        src: ['web/app/module.js', 'web/app/**/*.js'],
        dest: 'web/assets/js/app.js'
      }
    }
  });

  grunt.registerTask('compile', ['less:app', 'concat:app']);
  grunt.registerTask('run', ['compile', 'express:local', 'watch:app']);
};
