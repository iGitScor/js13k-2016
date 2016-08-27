var fs = require('fs');
var gulp = require('gulp');
var pug = require('gulp-pug');
var sass = require('gulp-sass');
var cleanCSS = require('gulp-clean-css');
var rename = require('gulp-rename');
var zip = require('gulp-zip');
var deploy = require('gulp-gh-pages');
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;

// Path configuration
var path = {
  root: './build/',
  src: {
    style: './src/style/index.scss',
    allStyles: './src/style/**/*.scss',
    tpl: './src/template/index.pug',
    allTemplates: './src/template/**/*.pug',
  },
  dist: {
    html: './build/*.html',
    htmlDir: './build/',
    css: './build/css/*.css',
    cssDir: './build/css/',
  },
};

// Log helpers
function logError(text) {
  console.log(
    `\x1b[1m\x1b[31m${text}\x1b[0m`
  );
}

function log(text) {
  console.log(
    `\x1b[1m${text}\x1b[0m`
  );
}

function logInfo(text) {
  console.log(
    `\x1b[34m${text}\x1b[0m`
  );
}

function logSuccess(text) {
  console.log(
    `\x1b[1m\x1b[32m${text}\x1b[0m`
  );
}

//Template task
gulp.task(
  'tpl',
  function markupIt() {
    gulp.src(path.src.tpl)
      .pipe(pug({}))
      .pipe(gulp.dest(path.dist.htmlDir));
  }
);

//Sass task
gulp.task(
  'style',
  function styleIt() {
    gulp.src(path.src.style)
      .pipe(sass().on('error', sass.logError))
      .pipe(cleanCSS({ debug: true }, function clean(details) {
          logInfo(`File ${details.name}`);
          logInfo(`\t-> ${details.stats.originalSize} (original)`);
          logInfo(`\t-> ${details.stats.minifiedSize} (minified)`);
        }
      ))
      .pipe(rename({
        suffix: '.min',
      }))
      .pipe(gulp.dest(path.dist.cssDir));
  }
);

//Serve task
gulp.task(
  'serve',
  function () {
    browserSync.init(
      {
        server: {
          baseDir: path.root,
        },
      }
    );
  }
);

// JS13K game - zip
gulp.task(
  'check',
  ['zip'],
  function (done) {
    var stats = fs.statSync('./release/entry.zip');
    var limit = 13 * 1024; // 13kb
    var fileSize = stats.size;
    if (fileSize > limit) {
      logError(`Your zip compressed game is larger than 13kb (${limit} bytes)!`);
      log(`Compressed file ${fileSize} bytes`);
    } else {
      logSuccess(`Compressed file ${fileSize} bytes`);
    }

    done();
  }
);

gulp.task(
  'zip',
  function (done) {
    var zipName = 'entry.zip';
    var zipDest = 'release';
    log(`Please check ${zipDest}/${zipName} to submit your entry`);
    return gulp.src(path.root + '**/*')
      .pipe(zip(zipName))
      .pipe(gulp.dest(zipDest));
  }
);

// Deploy to GitHub Pages.
gulp.task(
  'deploy',
  function () {
    logInfo(`Deploying to GitHub Pages`);

    gulp.src(path.root + '**/*')
      .pipe(deploy());
  }
);

//Watch task
gulp.task(
  'watch',
  ['serve'],
  function watchMode() {
    gulp.watch(path.src.allStyles, ['style', 'check']);
    gulp.watch(path.src.allTemplates, ['tpl', 'check']);
    gulp.watch([path.dist.html, path.dist.css]).on('change', reload);
    log(`BrowserSync reloads on template and style changes`);
  }
);
