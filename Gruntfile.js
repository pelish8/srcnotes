module.exports = function (grunt) {
  grunt.initConfig({
    jshint: {
      options: {
        globals: {
          browser: true,
          jquery: true,
          node: true
        },
        indent: 2,
        white: true,
        browser: true,
        curly: true,
        quotmark: 'single',
        trailing: true,
        funcscope: true,
        latedef: true,
        noarg: true,
        nonbsp: true,
        es3: true, // older browsers support http://www.jshint.com/docs/options/#es3
        maxcomplexity: 5 //http://en.wikipedia.org/wiki/Cyclomatic_complexity
      },
      all: ['Gruntfile.js', 'src/js/**/*.js']
    },
    sass: {
      development: {
        options: {
          includePaths: ['./src/sass/']
        },
        files: {
          './srcnotes/css/srcnotes.css': './src/sass/master.scss'
        }
      }
    },
    concat: {
      js: {
        src: [
          './src/js/helpers.js',
          './src/js/sync.js',
          './src/js/Models/*',
          './src/js/Collections/*',
          './src/js/Views/*',
          './src/js/app.js'
        ],
        dest: './srcnotes/js/srcnotes.js',
        options: {
          banner: '; (function ($, _, Backbone) {\n var SRCNotes = {};\n\n',
          footer: '\n}).call(this, jQuery, _, Backbone);\n'
        }
      },
      'dep.js': {
        src: [
          './components/jquery/jquery.js',
          './components/jQuery.scrollToElement/jquery.scrollToElement.js',
          './components/localforage/dist/localforage.js',
          './components/underscore/underscore.js',
          './components/backbone/backbone.js'
        ],
        dest: './srcnotes/js/srcnotes.dep.js'
      },
      'dep.css': {
        src: [
          './components/pure/base.css',
          './components/pure/forms.css',
          './components/pure/grids.css',
          './components/pure/buttons.css'
        ],
        dest: './srcnotes/css/srcnotes.dep.css'
      }
    },
    watch: {
      sass: {
        files: './src/sass/*',
        tasks: ['sass']
      },
      js: {
        files: './src/js/**/*.js',
        tasks: ['jshint', 'concat:js']
      },
      'dep.js': {
        files: './components/*',
        tasks: ['concat:dep.js']
      },
      gruntFile: {
        files: ['./Gruntfile.js', './index.html'],
        tasks: ['build']
      }
    }
  });
  // grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-sass');
    
  grunt.registerTask('default', function () {
    grunt.log.oklns('options:\n1. watch\n2. build');
  });
    
  grunt.registerTask('build', 'Build app.', function () {
    grunt.task.run([
      'jshint',
      'concat',
      'sass'
    ]);
  });
};