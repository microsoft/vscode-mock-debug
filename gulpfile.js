/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

var gulp = require('gulp');
var path = require('path');
var tsb = require('gulp-tsb');
var log = require('gulp-util').log;
var git = require('git-rev-sync');
var del = require('del');
var runSequence = require('run-sequence');

var compilation = tsb.create(path.join(__dirname, 'tsconfig.json'), true);

var sources = [
	'common/**/*.ts',
	'mock/**/*.ts',
	'typings/**/*.ts',
	'test/**/*.ts'
];

var dest = 'out';
var pluginDest = 'plugin/' + git.short();

gulp.task('build', function() {
	return gulp.src(sources, { base: '.' })
		.pipe(compilation())
		.pipe(gulp.dest(dest));
});

gulp.task('copy-out', function() {
	return gulp.src('out/**/*').pipe(gulp.dest(pluginDest + '/out'));
});

gulp.task('copy-node-modules', function() {
	return gulp.src('node_modules/source-map/**/*').pipe(gulp.dest(pluginDest + '/node_modules/source-map'));
});

gulp.task('plugin-clean', function() {
	return del('plugin/**/*');
})

gulp.task('ts-watch', ['build'], function(cb) {
	log('Watching build sources...');
    gulp.watch(sources, ['build']);
});

gulp.task('default', function(callback) {
	runSequence('build', callback);
});

gulp.task('plugin-build', function(callback) {
	runSequence(['build', 'plugin-clean'], ['copy-out', 'copy-node-modules'], callback);
});

