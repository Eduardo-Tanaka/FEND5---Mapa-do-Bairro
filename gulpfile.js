var gulp = require('gulp');
var uglify = require('gulp-uglify');
var cleanCSS = require('gulp-clean-css');
var htmlmin = require('gulp-htmlmin');
var inlineCss = require('gulp-inline-css');

// minify css
gulp.task('minify-css', function() {
  return gulp.src('src/css/*.css')
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(gulp.dest('dist/css/'));
});

// minify js
gulp.task('uglify', function() {
  return gulp.src('src/js/*.js')
	.pipe(uglify())
	.pipe(gulp.dest('dist/js/'));
});

// minify html
gulp.task('minify-html', function() {
  return gulp.src('src/*.html')
	//.pipe(inlineCss())
    .pipe(htmlmin({collapseWhitespace: true, removeComments:true}))
    .pipe(gulp.dest('dist'));
});

gulp.task('default', [ 'minify-css', 'uglify',  'minify-html' ]);