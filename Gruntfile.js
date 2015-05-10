module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    less: {
      web: {
        files: {
          'web/assets/css/styles.css': 'web/app/main.less'
        }
      }
    },

    watch: {
      web: {
        files: 'web/app/**/*',
        tasks: ['less:web', 'concat:web']
      },
      back: {
        files: ['back/**/*.{js,html}'],
        tasks: ['express:local'],
        options: {
          atBegin: true,
          spawn: false
        }
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
      web: {
        src: ['web/app/module.js', 'web/app/**/*.js'],
        dest: 'web/assets/js/app.js'
      }
    },

    concurrent: {
      options: {
        logConcurrentOutput: true
      },
      dev: ['watch:back', 'watch:web']
    },

    compile: {
      dev: ['less:web', 'concat:web']
    }
  });

  grunt.registerMultiTask('compile', function() {
    grunt.task.run(this.data);
  });

  grunt.registerTask('run', ['compile:dev', 'concurrent:dev']);

};
