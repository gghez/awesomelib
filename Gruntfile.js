module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        less: {
            app: {
                files: {
                    'web/assets/css/styles.css': 'web/app/main.less'
                }
            },
            'bs-loader': {
                files: {
                    'web/assets/libs/bs-loader/bs-loader.css': 'node_modules/bs-loader/bsLoader.less'
                }
            }
        },

        watch: {
            web: {
                files: 'web/app/**/*',
                tasks: ['less:app', 'concat:app']
            },
            back: {
                files: ['src/**/*.{js,html}'],
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
                    args: ['--debug'],
                    port: 3788
                }
            }
        },

        concat: {
            app: {
                src: ['web/app/module.js', 'web/app/**/*.js'],
                dest: 'web/assets/js/app.js'
            },
            'bs-loader': {
                src: ['node_modules/bs-loader/bsLoader.js', 'node_modules/bs-loader/*{Directive,Service}.js'],
                dest: 'web/assets/libs/bs-loader/bs-loader.js'
            }
        },

        concurrent: {
            options: {
                logConcurrentOutput: true
            },
            dev: ['watch:back', 'watch:web']
        },

        compile: {
            dev: ['less', 'concat']
        }
    });

    grunt.registerMultiTask('compile', function () {
        grunt.task.run(this.data);
    });

    grunt.registerTask('run', ['compile:dev', 'concurrent:dev']);

};
