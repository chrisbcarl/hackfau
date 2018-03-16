var autoprefixer = require('gulp-autoprefixer')
  , browserSync  = require('browser-sync').create()
  , ghPages      = require('gulp-gh-pages')
  , gulp         = require('gulp')
  , imagemin     = require('gulp-imagemin')
  , jscs         = require('gulp-jscs')
  , jshint       = require('gulp-jshint')
  , plumber      = require('gulp-plumber')
  , pngquant     = require('imagemin-pngquant')
  , rename       = require('gulp-rename')
  , replace      = require('gulp-replace')
  , rimraf       = require('rimraf')
  , runSequence  = require('run-sequence')
  , sass         = require('gulp-sass')
  , scsslint     = require('gulp-scss-lint')
  , spawn        = require('child_process').spawn
  , sourcemaps   = require('gulp-sourcemaps')
  , uglify       = require('gulp-uglify');

// SASS

gulp.task('sass:lint', function() {
  return gulp.src('./_sass/*.scss')
    .pipe(plumber())
    .pipe(scsslint());
});

gulp.task('sass:build', function() {
  // There is a known issue where Gulp stops compiling after the first SASS
  // error it encounters.  Removing the return here fixes that issue.

  gulp.src('./_sass/main.scss')
    .pipe(plumber())
    .pipe(rename({suffix: '.min'}))
    .pipe(sourcemaps.init())
    .pipe(replace('/*!', '/*'))
    .pipe(sass({ outputStyle: 'compressed' }))
    .pipe(autoprefixer())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./css/'))
    .pipe(browserSync.stream());
});

gulp.task('sass', ['sass:lint', 'sass:build']);

// JS

gulp.task('js:lint', function() {
  return gulp.src(['./js/**/*.js', '!./js/lib/**/*.js', '!./js/**/*.min.js', 'gulpfile.js'])
    .pipe(plumber())
    .pipe(jscs.reporter())
    .pipe(jshint({ laxcomma: true }))
    .pipe(jshint.reporter('default'));
});

gulp.task('js:build', function() {
  return gulp.src(['./js/**/*.js', '!./js/**/*.min.js'])
    .pipe(plumber())
    .pipe(rename({suffix: '.min'}))
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./js/'))
    .pipe(browserSync.stream());
});

gulp.task('js', ['js:lint', 'js:build']);

// Images

gulp.task('images', function () {
  return gulp.src('./img/**/*')
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{ removeViewBox: false }],
      use: [pngquant()]
    }))
    .pipe(gulp.dest('./img/'))
    .pipe(browserSync.stream());
});

// Jekyll

gulp.task('jekyll:watch', function() {
  spawn('bundle', ['exec', 'jekyll', 'build', '--incremental', '--watch'], { stdio: 'inherit', env: process.env });
});

gulp.task('jekyll', function(cb) {
  return spawn('bundle', ['exec', 'jekyll', 'build'], { stdio: 'inherit', env: process.env }).on('close', cb);
});

// Deploy

gulp.task('deploy', ['build'], function(){
  return gulp.src('./_site/**/*')
    .pipe(ghPages());
});

// Misc.

gulp.task('clean', function(cb) {
  return rimraf('./_site/', cb);
});

gulp.task('watch', function() {
  gulp.watch('./_sass/**/*.scss', ['sass']);
  gulp.watch(['./js/**/*.js', 'gulpfile.js'], ['js']);
  gulp.watch(['./img/**/*'], ['images']);
});

gulp.task('build', function(cb) {
  return runSequence('clean', ['sass', 'js', 'images'], 'jekyll', cb);
});

gulp.task('serve', ['watch', 'jekyll:watch'], function(cb) {
  browserSync.init({ server: { baseDir: './_site/' }, notify: false });

  // Delay for 1 second, otherwise spam browser with initial loads
  setTimeout(function() {
    gulp.watch('./_site/**/*.*').on('change', browserSync.reload);
    cb();
  }, 1000);
});

gulp.task('default', function(cb) {
  return runSequence('build', 'serve', cb);
});
