var concat = require('gulp-concat'),
    del = require('del'),
    environments = require('gulp-environments'),
    gulp = require('gulp'),
    jeditor = require("gulp-json-editor"),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify');

var production = environments.production;

gulp.task('clean', function () {
	return del(['build']);
});

gulp.task('webpage', function () {	
	return gulp.src(['FireBreathPromise.js', 'firewyrm.js', 'wyrmhole.js', 'wyrmhole-page.js', 'initialize.js']
	                .map(function (f) {return "src/webpage/" + f;}))
		.pipe(concat('webpage.js'))
		.pipe(production(uglify()))
		.pipe(gulp.dest('build'));
});

gulp.task('scripts', ['webpage'], function () {
	return gulp.src('src/*.js')
		.pipe(production(uglify()))
		.pipe(gulp.dest('build'));
});

gulp.task('images', function () {
	return gulp.src('img/*.png')
		.pipe(gulp.dest('build'));
});

gulp.task('manifest', function () {
	return gulp.src('manifest.json')
		.pipe(production(jeditor(function (json) {
			delete json.key;
			return json;
		})))
		.pipe(gulp.dest('build'));
});


gulp.task('default', ['clean'], function () {
	gulp.start('scripts', 'images', 'manifest');
});

gulp.task('watch', function () {
	gulp.watch('src/**/*.js', ['scripts']);
	gulp.watch('img/*.png', ['images']);
	gulp.watch('manifest.json', ['manifest']);
});
