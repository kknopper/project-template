var gulp = require('gulp'),
	gutil = require('gulp-util'),
	plumber = require('gulp-plumber'),
	sass = require('gulp-sass'),
	scsslint = require('gulp-scss-lint'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	// jshint = require('gulp-jshint'),
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
 	htmlInjector = require('bs-html-injector'),
 	browserSync = require('browser-sync').create();

var paths = {
	srcRoot: "./src",
	distRoot: "./target"
}

var conf = {
	src: {
		html: paths.srcRoot + '/html/*.html',
		js: paths.srcRoot + '/js/main.js',
		scss: paths.srcRoot + '/scss/**/*.scss',
		fonts: paths.srcRoot + '/fonts/**/*',
		imgs: paths.srcRoot + '/images/**/*',
		docs: paths.srcRoot + '/documents/**/*'
	},
	dist: {
		html: paths.distRoot + '/',
		js: paths.distRoot + '/js/',
		css: paths.distRoot + '/css/',
		fonts: paths.distRoot + '/fonts/',
		imgs: paths.distRoot + '/images/',
		docs: paths.distRoot + '/documents/'
	}
};

//SCRIPTS WITH ES6 BABEL and Watchify
function scripts(watch) {

	if (watch) {
		var bundler = watchify(browserify('./src/js/main.js', { debug: true }));
	} else {
		var bundler = browserify('./src/js/main.js', { debug: true });
	}
	
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
	gulp.src(conf.src.fonts)
		.pipe(gulp.dest(conf.dist.fonts));
	browserSync.reload();
	// done();
});


//Minify images
gulp.task('imgs', function() {
	gulp.src(conf.src.imgs)
        .pipe(imagemin())
        .pipe(gulp.dest(conf.dist.imgs));
    // browserSync.reload();
});


//Copies docs from src to dist
gulp.task('docs', function(){
	gulp.src(conf.src.docs)
		.pipe(gulp.dest(conf.dist.docs));
	// browserSync.reload();
	// done();
});

gulp.task('html', function(){
	// var dest = conf.dist + "/css/"
	return gulp.src(conf.src.html)
	    .pipe(gulp.dest(conf.dist.html))
	    .pipe(browserSync.stream());
});
console.log(__dirname)

//Scss with autoprefixer and sourcemaps
gulp.task('scss', function(){
	console.log(__dirname + '/node_modules')
	gulp.src(conf.src.scss)
		.pipe(plumber())
		.pipe(sourcemaps.init())
	    .pipe(sass.sync({
			includePaths: [
				// __dirname + '/node_modules/normalize.css/',
				// __dirname + '/node_modules/sanitize.css/',
				__dirname + '/node_modules/megatype/',
				__dirname + '/node_modules/Kraken/src/sass'
			]
	    }).on('error', sass.logError))
	    .pipe(sourcemaps.write())
	    .pipe(autoprefixer())
	    .pipe(gulp.dest(conf.dist.css))
	    .pipe(browserSync.stream());
});


//Deletes dist root before every build
gulp.task('clean', function(){
	return del([paths.distRoot+'/**/*']);
});

//Start browser-Sync Server
gulp.task('server', function() {
	
	//Inject html without reloading
	browserSync.use(htmlInjector, {
    	files: conf.dist.html
  	});

	browserSync.init({
        proxy: "http://project-template.kevin.dev",
        open: true
    });
})

//Default gulp cmd
gulp.task('default', function() {
	runSequence('clean', ['html', 'scss', 'js', 'fonts', 'imgs', 'docs'])
});

gulp.task('watch', function() {
	runSequence('clean', ['html', 'scss', 'js', 'fonts', 'imgs', 'docs']);
	gulp.watch(conf.src.html, ['html']);
	gulp.watch(conf.src.scss, ['scss']);
	gulp.watch(conf.src.imgs, ['imgs']);
	gulp.watch(conf.src.docs, ['docs']);
	gulp.watch(conf.src.js, ['js-watch']);
})


//gulp dev cmd
gulp.task('dev', function() {
	runSequence('server', 'watch')
});