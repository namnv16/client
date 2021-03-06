/* global process */

/* global __dirname */

const path = require('path');
const envify = require('loose-envify/custom');
const glob = require('glob');

let chromeFlags = [];
process.env.CHROME_BIN = require('puppeteer').executablePath();

// On Travis and in Docker, the tests run as root, so the sandbox must be
// disabled.
if (process.env.TRAVIS || process.env.RUNNING_IN_DOCKER) {
  chromeFlags.push('--no-sandbox');

  // Enable debug logging from Chrome to help track down a cause of frequent
  // build failures in Jenkins. The log files are written to `chrome_debug.log`
  // in the workspace for the current build.
  chromeFlags.push('--enable-logging');
  chromeFlags.push('--v=1');
  process.env.CHROME_LOG_FILE = path.resolve(
    __dirname + '/../',
    'chrome_debug.log'
  );

  // Enable even more debug logging from Chrome to help track down build
  // failures in Jenkins. This generates a large (~40MB+) JSON file detailing
  // events that happen during browser startup.
  //
  // See https://www.chromium.org/developers/how-tos/trace-event-profiling-tool/recording-tracing-runs#TOC-Capturing-chrome-desktop-startup
  const traceFile = path.resolve(__dirname + '/../', 'chrome_trace.json');
  chromeFlags.push('--trace-startup');
  chromeFlags.push('--trace-startup-duration=7');
  chromeFlags.push(`--trace-startup-file=${traceFile}`);
}

if (process.env.RUNNING_IN_DOCKER) {
  // Disable `/dev/shm` usage as this can cause Chrome to fail to load large
  // HTML pages, such as the one Karma creates with all the tests loaded.
  //
  // See https://github.com/GoogleChrome/puppeteer/issues/1834 and
  // https://github.com/karma-runner/karma-chrome-launcher/issues/198.
  chromeFlags.push('--disable-dev-shm-usage');

  // Use Chromium from Alpine packages. The one that Puppeteer downloads won't
  // load in Alpine.
  process.env.CHROME_BIN = 'chromium-browser';
}

module.exports = function(config) {
  let testFiles = [
    'annotator/**/*-test.coffee',
    '**/test/*-test.js',
    '**/integration/*-test.js',
  ];

  if (config.grep) {
    const allFiles = testFiles
      .map(pattern => glob.sync(pattern, { cwd: __dirname }))
      .flat();
    testFiles = allFiles.filter(path => path.match(config.grep));

    // eslint-disable-next-line no-console
    console.log(`Running tests matching pattern "${config.grep}": `, testFiles);
  }

  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: './',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['browserify', 'mocha', 'chai', 'sinon'],

    // list of files / patterns to load in the browser
    files: [
      // Test setup
      './sidebar/test/bootstrap.js',

      // Empty HTML file to assist with some tests
      { pattern: './annotator/test/empty.html', watched: false },

      // Test modules.
      ...testFiles.map(pattern => ({
        pattern,

        // Disable watching because karma-browserify handles this.
        watched: false,
      })),

      // CSS bundles, relied upon by accessibility tests (eg. for color-contrast
      // checks).
      {
        pattern: '../build/styles/{annotator,icomoon,sidebar}.css',
        watched: false,
      },
    ],

    // list of files to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      './shared/polyfills/*.js': ['browserify'],
      './sidebar/test/bootstrap.js': ['browserify'],
      '**/*-test.js': ['browserify'],
      '**/*-test.coffee': ['browserify'],
      '**/*-it.js': ['browserify'],
    },

    browserify: {
      debug: true,
      extensions: ['.coffee'],
      transform: [
        'coffeeify',
        [
          'babelify',
          {
            // The transpiled CoffeeScript is fed through Babelify to add
            // code coverage instrumentation for Istanbul.
            extensions: ['.js', '.coffee'],
            plugins: [
              'mockable-imports',
              [
                'babel-plugin-istanbul',
                {
                  exclude: ['**/test/**/*.{coffee,js}'],
                },
              ],
            ],
          },
        ],
        // Enable debugging checks in libraries that use `NODE_ENV` guards.
        [envify({ NODE_ENV: 'development' }), { global: true }],
      ],
    },

    mochaReporter: {
      // Display a helpful diff when comparing complex objects
      // See https://www.npmjs.com/package/karma-mocha-reporter#showdiff
      showDiff: true,

      // Output only summary and errors in development to make output easier
      // to parse.
      output: 'minimal',
    },

    coverageIstanbulReporter: {
      dir: path.join(__dirname, '../coverage'),
      reports: ['json', 'html'],
      'report-config': {
        json: { subdir: './' },
      },
    },

    // Use https://www.npmjs.com/package/karma-mocha-reporter
    // for more helpful rendering of test failures
    reporters: ['mocha', 'coverage-istanbul'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    browserConsoleLogOptions: {
      level: 'log',
      format: '%b %T: %m',
      terminal: true,
    },

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['ChromeHeadless_Custom'],
    browserNoActivityTimeout: 20000, // Travis is slow...

    customLaunchers: {
      ChromeHeadless_Custom: {
        base: 'ChromeHeadless',
        flags: chromeFlags,
      },
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Log slow tests so we can fix them before they timeout
    reportSlowerThan: 500,
  });
};
