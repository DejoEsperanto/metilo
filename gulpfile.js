/*
 * Copyright (C) 2017 Mia Nordentoft, Metilo contributors
 *
 * This file is part of Metilo.
 *
 * Metilo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Metilo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Metilo. If not, see <http://www.gnu.org/licenses/>.
 */

const gulp = require('gulp');
const watch = require('gulp-watch');
const babel = require('gulp-babel');
const plumber = require('gulp-plumber');
const less = require('gulp-less');
const path = require('path');
const sourcemaps = require('gulp-sourcemaps');
const Prefix = require('less-plugin-autoprefix');
const prefix = new Prefix({ browsers: [ "last 2 versions" ] });
const compileJS = function (source) {''
    return source
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/web/js'));
};

const compileCSS = function (source) {
    return source
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(less({ paths: [path.join(__dirname, 'css')], plugins: [prefix] }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/web/css'));
};

const compileSrc = function (source) {
    return source
        .pipe(plumber())
        .pipe(babel())
        .pipe(gulp.dest('dist'));
};

gulp.task('compile-js', function () {
    return compileJS(gulp.src(['web/js/**/*.js']));
});

gulp.task('compile-css', function () {
    return compileCSS(gulp.src(['web/css/**/*.less']));
});

gulp.task('compile-src', function () {
    return compileSrc(gulp.src(['src/**/*.js']));
})

gulp.task('compile', ['compile-js', 'compile-css', 'compile-src']);

gulp.task('watch-compile', function () {
    compileJS(watch(['web/js/**/*.js']));
    compileCSS(watch(['web/css/**/*.less']));
    compileSrc(watch(['src/**/*.js']));
});

gulp.task('default', ['compile', 'watch-compile']);
