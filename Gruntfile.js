module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({

    clean: ["dist", ".build"],

    watch: {
      all: {
        files: ['src/*.js', 'test/*.js'],
        tasks: ['test', 'build'],
        options: {spawn: false}
      }
    },

    babel: {
      options: {
        sourceMap: true,
        presets:  ['es2015']
      },
      dist: {
        options: {
          plugins: [
            'transform-es2015-modules-systemjs',
            'transform-es2015-for-of']
        },
        files: [{
          cwd: 'src',
          expand: true,
          src: ['**/*.js'],
          dest: '.build/dist',
          ext:'.js'
        }]
      },
      test: {
        options: {
          plugins: ['transform-object-assign']
        },
        files: [{
          cwd: '.',
          expand: true,
          flatten: true,
          src: ['src/*.js', 'test/*.js'],
          dest: '.build/test',
          ext:'.js'
        }]
      }
    },

    systemjs: {
      options: {
        sfx: true,
        minify: false,
        sourceMaps: true,
        baseURL: '.build/dist',
        build : {
          externals: ['moment'],
          globalName: 'Dalmatiner',
          globalDeps: {
            moment: 'moment'
          }
        }
      },
      dist: {
        files: [{
          "src":  "./.build/dist/index.js",
          "dest": "lib/index.js"
        }]
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          clearRequireCache: true
        },
        src: ['.build/test/*_spec.js']
      }
    }
  });

  grunt.registerTask('test', ['babel:test', 'mochaTest']);
  grunt.registerTask('build', ['babel:dist', 'systemjs']);
  grunt.registerTask('default', ['clean', 'build']);
};
