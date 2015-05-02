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

    concat: {
      web: {
        src: ['web/app/module.js', 'web/app/**/*.js'],
        dest: 'web/assets/js/app.js'
      }
    }
  });

  grunt.registerTask('compile', ['less', 'concat:web']);
};
