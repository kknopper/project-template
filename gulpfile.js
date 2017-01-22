var gulp = require('gulp'),
	gutil = require('gulp-util'),
	sass = require('gulp-sass'),
	scsslint = require('gulp-scss-lint'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	jshint = require('gulp-jshint'),
	del = require('del'),
	runSequence = require('run-sequence'),
	sourcemaps = require('gulp-sourcemaps'),
 	autoprefixer = require('gulp-autoprefixer'),
 	imagemin = require('gulp-imagemin'),
 	source = require('vinyl-source-stream');
 	buffer = require('vinyl-buffer'),
 	exorcist = require('exorcist'),
 	browserify = require('browserify'),
 	babelify = require('babelify'),
 	watchify = require('watchify'),
 	browserSync = require('browser-sync').create();

var conf = {
	"src" : "./src/**/*",
	"srcRoot": "./src/"
	"src": {
		"js": conf.srcRoot + '/js/main.js',
		"scss": conf.srcRoot + '/scss/**/*.scss',
		"fonts": conf.srcRoot + '/fonts/**/*',
		"imgs": conf.srcRoot + '/images/**/*',
		"docs": conf.srcRoot + '/documents/**/*'
	}
	"distRoot" : "./dist/",
	"dist": {
		"js": conf.distRoot + '/js/',
		"scss": conf.distRoot + '/scss/',
		"fonts": conf.distRoot + '/fonts/',
		"imgs": conf.distRoot + '/images/',
		"docs": conf.distRoot + '/documents/'
	}
};

//SCRIPTS WITH ES6 BABEL and Watchify
function scripts(watch) {

	var bundler = watchify(browserify('./src/main.js', { debug: true }));
	
	//Transform with Babel
	bundler.transform(babelify.configure({
    	sourceMapRelative: 'src/js'
	}));

	function rebundle() {

		gutil.log('Compiling JS...');

		bundler.bundle()
		  .on('error', function(err) { console.error(err); gutil.log(err); browserSync.notify("Browserify Error!"); this.emit('end'); })
		  .pipe(exorcist(conf.dist.js + 'bundle.js.map'))
		  .pipe(source('main.js'))
		  .pipe(buffer())
		  .pipe(sourcemaps.init({ loadMaps: true }))
		  .pipe(sourcemaps.write('./'))
		  .pipe(gulp.dest(conf.dist.js))
		  .pipe(browserSync.stream({once: true}));
		}

		if (watch) {
		bundler.on('update', function() {
		  console.log('-> bundling...');
		  rebundle();
		});
	}

	rebundle();
}

function scriptsWatch() {
  return scripts(true);
};


//Gulp task to compile Scripts with Browserify and ES6
gulp.task('js', function() { return scripts(); });


//Watches js and updates on changes
gulp.task('js-watch', function() { return scriptsWatch(); });


//Copies fonts from src to dist
gulp.task('fonts', function(){
	gulp.src(conf.fonts)
		.pipe(gulp.dest(conf.dist + /fonts/));
	browserSync.reload();
	done();
});


//Minify images
gulp.task('imgs', function() {
	gulp.src(conf.images)
        .pipe(imagemin())
        .pipe(gulp.dest(conf.dist + /images/));
    browserSync.reload();
	done();
});


//Copies docs from src to dist
gulp.task('docs', function(){
	gulp.src(conf.src.docs)
		.pipe(gulp.dest(conf.dist.docs));
	browserSync.reload();
	done();
});


//Scss with autoprefixer and sourcemaps
gulp.task('scss', function(){
	var dest = conf.dist + "/css/"
	return gulp.src(conf.src.scss)
		.pipe(sourcemaps.init())
	    .pipe(sass.sync().on('error', sass.logError))
	    .pipe(sourcemaps.write())
	    .pipe(autoprefixer())
	    .pipe(gulp.dest(conf.dest.scss))
	    .pipe(browserSync.stream());
});


//Deletes dist root before every build
gulp.task('clean', function(){
	return del([conf.distRoot]);
});

//Start browser-Sync Server
gulp.task('server', function() {
	browserSync.init({
        proxy: "http://127.0.0.1:8080/",
        open: true
    });
})

//Default gulp cmd
gulp.task('default', function() {
	runSequence('server', 'clean', ['scss', 'scripts', 'fonts', 'imgs', 'docs'])
});

gulp.task('watch', function() {
	runSequence('clean', ['scss', 'js', 'fonts', 'imgs', 'docs']);
	gulp.watch(conf.src.scss, ['scss']);
	gulp.watch(conf.src.imgs, ['imgs']);
	gulp.watch(conf.src.docs, ['docs']);
	gulp.watch(conf.src.js, ['js-watch']);
})


//gulp dev cmd
gulp.task('dev', function() {
	runSequence('server', 'watch')
});