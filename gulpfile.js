"use strict"
var gulp = require('gulp')
var inno = require('gulp-inno');
var electron = require('gulp-electron');
var fs = require('fs');

var gnf = require('./npm-files')
var electronVersion = require('./package.json').electronVersion;
var pkg = require(`${process.cwd()}/package.json`)
var compileDir = './compile';
var clean = require('gulp-clean');
var path = require('path');
var R = require('ramda');

gulp.task('version', function(){
  var pkg = require(`${process.cwd()}/package.json`);
  fs.writeFileSync('version.json', JSON.stringify({
    version: pkg.version,
  }))
})

gulp.task('copy', ['version','copy:modules'], function(){
  return gulp.src( pkg.sourceFiles || ['*.*'], 
    {base: process.cwd()})
    .pipe(gulp.dest(compileDir));
});

gulp.task('copy:modules', function(){
  return new Promise(function(resolve,reject){
    gnf().then(function(src){
      gulp.src(src,{base : "./"})
          .pipe(gulp.dest(compileDir))
          .on('end',resolve);
    });    
  })
});

gulp.task('electron',['copy'], function() {
  return gulp.src("")
    .pipe(electron({
      src: './compile',
      release: './release',
      cache: './.cache',
      packageJson: pkg,
      packaging: true,
      version: electronVersion,
      platforms: process.env.PLATFORMS.split(','), 
      asar: true,
      platformResources: {
        win: {
          "version-string": pkg.version,
          "file-version": pkg.version,
          "product-version": pkg.version,
          icon: process.env.ICON,
        },
      }
    }))
    .pipe(gulp.dest(""));
})

gulp.task('prevent', ['electron'], function() {
  return gulp.src(R.map(function(platform) {
    return path.resolve(process.cwd(), `release/${electronVersion}/${platform}/resources/app/`);
  }, process.env.PLATFORMS.split(','))).pipe(clean({
    force: true
  }));
});

gulp.task('inno', ['prevent'], function() {
  return gulp.src(process.env.INNOFILE).pipe(inno());
});

gulp.task('default', ['copy'])
