/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

var gulp = require('gulp');
var path = require('path');
var tsb = require('gulp-tsb');
var log = require('gulp-util').log;
var del = require('del');
var runSequence = require('run-sequence');

var compilation = tsb.create(path.join(__dirname, 'tsconfig.json'), true);

var sources = [
	'src/**/*.ts',
	'typings/**/*.ts'
];

var dest = 'out';

gulp.task('default', function(callback) {
	runSequence('clean', 'build', callback);
});

gulp.task('build', function() {
	return gulp.src(sources, { base: '.' })
		.pipe(compilation())
		.pipe(gulp.dest(dest));
});

gulp.task('clean', function() {
	return del(dest);
})

gulp.task('ts-watch', ['build'], function(cb) {
	log('Watching build sources...');
    gulp.watch(sources, ['build']);
});
