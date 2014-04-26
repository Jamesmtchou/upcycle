var gulp = require('gulp');
var plugin = require('gulp-load-plugins')();
var wiredep = require('wiredep');
var gulpBowerFiles = require('gulp-bower-files');
var mochaPhantomJs = require('gulp-mocha-phantomjs');
var paths = {
	src: {
        cssDir: "src/css",
        css: "src/css/*.css",
        jsDir:"src/js",
        js:"src/js/*.js",
        templates: "src/templates/*.hbs",
        lessDir: "src/less",
        less: "src/less/*.less"
	},
	test: {
		js:"test/*.js",
		runnerTemplate: "test/runner-template.html",
		runner: "test/index.html"
	},
    themes: {
        less: "themes/**/main.less",
        base: {
            less: "themes/base/less/*.less",
            lessMain: "themes/base/less/base.less",
            css: "themes/base/css/*.css",
            cssMain: "themes/base/css/base.css",
            cssDir: "themes/base/css"
        },
        portal: {
            less: "themes/portal/less/*.less",
            lessMain: "themes/portal/less/portal.less",
            css: "themes/portal/css/*.css",
            cssMain: "themes/portal/css/portal.css",
            cssDir: "themes/portal/css"
        }
    },
    build:{
        dir: "build",
        js: "build/upcycle.js",
        themes:"build/themes"
    },
    docs: {
        dir: "docs",
        index: "docs/index.html"
    },
	testDir: "test",
    buildDir: "build"
};
var filePathRegex = /(\w+(?=\/)|\/)/g;
gulp.task('clean', function(){
    gulp.src(paths.build.dir, {read: false})
        .pipe(plugin.clean());
});
/**
 * Compiles source .hbs files and saves to
 * /src/js/templates.js
 * @return {[type]} [description]
 */
gulp.task('templates', function(){
  gulp.src([paths.src.templates])
    .pipe(plugin.handlebars())
    .pipe(plugin.defineModule('plain'))
    .pipe(plugin.declare({
      namespace: "upcycle.templates"
    }))
    .pipe(plugin.concat('templates.js'))
    .pipe(gulp.dest(paths.src.jsDir));
});
/**
 * Compiles main.less theme files and saves them
 * to /build/themename.css
 * @return {[type]} [description]
 */
gulp.task('less', function(){
    return gulp.src(paths.themes.less)
        .pipe(plugin.less({paths: [paths.themes.less]}))
        .pipe(plugin.rename(function(path){
            path.basename = path.dirname.substring(0, path.dirname.indexOf('/'));
            path.dirname = '';  
        }))
        .pipe(gulp.dest(paths.build.themes))
        .on('error', plugin.util.log);
});
/**
 * Concat the source Javascript files and save to
 * /build/upcycle.js
 * @return {[type]} [description]
 */
gulp.task('js', function(){
    return gulp.src(paths.src.js)
        .pipe(plugin.concat(paths.build.dir + '/upcycle.js'))
        .pipe(plugin.rename(function(path){
            path.dirname = '';
        }))
        .pipe(gulp.dest(paths.build.dir))
        .on('error', plugin.util.log);
});
/**
 * Generates /test/index.html injecting source and 
 * unit test js files, then runs it through phantomjs.
 * @return {[type]} [description]
 */
gulp.task('test', function() {
    gulp.src(paths.test.runnerTemplate)
        .pipe(wiredep.stream({
            devDependencies: true
        }))
        .pipe(plugin.inject(gulp.src(paths.src.js, {read: false}), {starttag:'<!-- inject:source:{{ext}} -->', addRootSlash:false, addPrefix:'..'}))
        .pipe(plugin.inject(gulp.src(paths.test.js, {read: false}), {starttag:'<!-- inject:tests:{{ext}} -->', addRootSlash:false, addPrefix:'..'}))
        .pipe(plugin.rename(paths.test.runner.replace(filePathRegex, '')))
        .pipe(gulp.dest(paths.testDir));

    return gulp.src(paths.test.runner)
    	.pipe(mochaPhantomJs());
});
/**
 * Generates /docs/index.html injecting upcycle.js, themenames.css 
 * and styles for the docs page.
 * @return {[type]} [description]
 */
gulp.task('docs', function(){
    gulp.src(paths.docs.dir + '/docs.less')
        .pipe(plugin.less({paths: [paths.docs.dir + '/docs.less']}))
        .pipe(gulp.dest(paths.docs.dir));

    gulp.src('docs/index-template.html')
        .pipe(wiredep.stream({
            devDependencies: true
        }))
        .pipe(plugin.inject(gulp.src(paths.build.js, {read: false}), {starttag:'<!-- inject:source:{{ext}} -->', addRootSlash:false, addPrefix:'..'}))
        .pipe(plugin.inject(gulp.src(paths.build.themes+'/*.css', {read: false}), {starttag:'<!-- inject:{{ext}} -->', addRootSlash:false, addPrefix:'..'}))
        .pipe(plugin.rename(paths.docs.index.replace(filePathRegex, '')))
        .pipe(gulp.dest(paths.docs.dir));
});

gulp.task('build', ['templates', 'js', 'less', 'docs']);
gulp.task('watch', function () {
    gulp.watch(paths.themes.base.less, ['less']);
    gulp.watch([paths.themes.base.css, paths.src.js], ['test']);
    gulp.watch(paths.src.templates, ['templates']);
});