const gulp = require('gulp'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    cleanCSS = require('gulp-clean-css'),
    browserSync = require('browser-sync').create();

function styles(){
    return gulp.src('sass/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest('./css/'))
        .pipe(browserSync.stream());
}

//Watch task
gulp.task('default',function() {
    gulp.watch('sass/**/*.scss', gulp.series(styles));
    gulp.watch("*.html").on('change', browserSync.reload);
});

gulp.task("sync", gulp.series("default", function(){
  browserSync.init({
    server: "./",
        notify: false
    });
}))