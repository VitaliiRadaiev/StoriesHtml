const { src, dest } = require("gulp");
const fs = require('fs');
const gulp = require("gulp");
const browsersync = require("browser-sync").create();
const fileinclude = require("gulp-file-include");
const del = require("del");
const autoprefixer = require("gulp-autoprefixer");
const scss = require('gulp-sass')(require('sass'));
const group_media = require("gulp-group-css-media-queries");
const rename = require("gulp-rename");
const clean_css = require("gulp-clean-css");
const uglify = require("gulp-uglify-es").default;
const newer = require('gulp-newer');
const plumber = require("gulp-plumber");

const project_name = "dist";
const src_folder = "#src";

const path = {
	build: {
		html: project_name + "/",
		js: project_name + "/js/",
		css: project_name + "/css/",
		images: project_name + "/img/",
		fonts: project_name + "/fonts/",
		public: project_name + "/public/"
	},
	src: {
		html: [src_folder + "/*.html", "!" + src_folder + "/_*.html"],
		js: [src_folder + "/js/app.js", src_folder + "/js/vendors.js"],
		css: src_folder + "/scss/style.scss",
		images: [src_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp,mp4}", "!**/favicon.*"],
		fonts: src_folder + "/fonts/*.{ttf,woff,woff2,eot,svg,otf}",
		public: src_folder + "/public/**/*"
	},
	watch: {
		html: src_folder + "/**/**/*.html",
		js: src_folder + "/**/**/*.js",
		css: src_folder + "/**/**/*.scss",
		images: src_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp,mp4}",
		fonts: src_folder + "/fonts/*.{ttf,woff,woff2,eot,svg,otf}",
		public: src_folder + "/public/**/*"
	},
	clean: "./" + project_name + "/"
};

function clean() {
	return del(path.clean);
}

function public() {
	return src(path.src.public, {})
	.pipe(dest(path.build.public))
}

function browserSync(done) {
	browsersync.init({
		server: {
			baseDir: "./" + project_name + "/"
		},
		notify: false,
		port: 3000,
	});
}

function html() {
	return src(path.src.html, {})
		.pipe(fileinclude())
		.pipe(dest(path.build.html))
		.pipe(browsersync.stream());
}

function css() {
	return src(path.src.css, {})
		.pipe(
			scss({
				outputStyle: "expanded"
			})
		)
		.pipe(group_media())
		.pipe(
			autoprefixer({
				grid: true,
				overrideBrowserslist: ["last 5 versions"],
				cascade: true
			})
		)
		.pipe(dest(path.build.css))
		.pipe(browsersync.stream())
		.pipe(clean_css())
		.pipe(
			rename({
				extname: ".min.css"
			})
		)
		.pipe(dest(path.build.css))
		.pipe(browsersync.stream());
}

function js() {
	return src(path.src.js, {})
		.pipe(fileinclude())
		.pipe(gulp.dest(path.build.js))
		.pipe(uglify(/* options */))
		.pipe(
			rename({
				suffix: ".min",
				extname: ".js"
			})
		)
		.pipe(dest(path.build.js))
		.pipe(browsersync.stream());
}

function images() {
	return src(path.src.images)
		.pipe(newer(path.build.images))
		.pipe(dest(path.build.images))
}

function fonts() {
	return src(path.src.fonts)
		.pipe(plumber())
		.pipe(dest(path.build.fonts));
}

function fontstyle() {
	let file_content = fs.readFileSync(src_folder + '/scss/fonts.scss');
	if (file_content == '') {
		fs.writeFile(src_folder + '/scss/fonts.scss', '', cb);
		return fs.readdir(path.build.fonts, function (err, items) {
			if (items) {
				let c_fontname;
				for (var i = 0; i < items.length; i++) {
					let fontname = items[i].split('.');
					fontname = fontname[0];
					if (c_fontname != fontname) {
						fs.appendFile(src_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
					}
					c_fontname = fontname;
				}
			}
		})
	}
}
function cb() { }


function watchFiles() {
	gulp.watch([path.watch.html], html);
	gulp.watch([path.watch.css], css);
	gulp.watch([path.watch.js], js);
	gulp.watch([path.watch.images], images);
	gulp.watch([path.watch.fonts], fonts);
	gulp.watch([path.watch.public], public);
}
let build = gulp.series(clean, gulp.parallel(html, css, js, images, fonts, public), gulp.parallel(fontstyle));
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.clean = clean;
exports.html = html;
exports.css = css;
exports.js = js;
exports.images = images;
exports.fonts = fonts;
exports.fontstyle = fontstyle;
exports.build = build;
exports.watch = watch;
exports.public = public;
exports.default = watch;