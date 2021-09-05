const { src, dest, watch, lastRun, parallel, series } = require("gulp");
const sass = require("gulp-sass")(require('sass')); //Sassを使う
const glob = require("gulp-sass-glob"); //sassのimportを楽にする
const postcss = require("gulp-postcss"); //Autoprefixと一緒に使うもの
const autoprefixer = require("autoprefixer"); //Autoprefix
const plumber = require("gulp-plumber"); //エラーでも強制終了させない
const notify = require("gulp-notify"); //エラーのときはデスクトップに通知
const del = require("del"); //ファイル、ディレクトリの削除
const ejs = require("gulp-ejs"); //htmlのパーツ化
const rename = require("gulp-rename"); //ejsの拡張子を変更
const pngquant = require("imagemin-pngquant"); //画像圧縮
const imagemin = require("gulp-imagemin"); //上と同じ
const mozjpeg = require("imagemin-mozjpeg"); //上と同じ
const babel = require("gulp-babel"); //JavaScriptのトランスパイル用
const uglify = require("gulp-uglify"); //JavaScriptの圧縮用
const browserSync = require("browser-sync"); //ブザウザ読み込み・反映
const replace = require("gulp-replace"); //余計なテキストを削除

//読み込むパスと出力するパスを指定
const srcPath = {
  html: {
    src: ["../src/ejs/**/*.ejs", "!" + "../src/ejs/**/_*.ejs"],
    dist: "../"
  },
  styles: {
    src: "../src/scss/**/*.scss",
    dist: "../assets/css/",
    map: "../assets/css/map"
  },
  scripts: {
    src: "../src/js/**/*.js",
    dist: "../assets/js/",
    map: "../assets/js/map"
  },
  images: {
    src: "../src/img/**/*.{jpg,jpeg,png,gif,svg}",
    dist: "../assets/img/"
  }
};

//htmlの処理自動化
const htmlFunc = () => {
  return src(srcPath.html.src)
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(ejs({}, {}, { ext: ".html" })) //ejsを纏める
    .pipe(rename({ extname: ".html" })) //拡張子をhtmlに
    .pipe(replace(/[\s\S]*?(<!DOCTYPE)/, "$1"))
    .pipe(dest(srcPath.html.dist))
    .pipe(browserSync.reload({ stream: true }));
};

//Sassの処理自動化（開発用）
const stylesFunc = () => {
  return src(srcPath.styles.src, { sourcemaps: true })
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(glob())
    .pipe(sass({ outputStyle: "expanded" }).on("error", sass.logError))
    .pipe(
      postcss([
        autoprefixer({
          // IEは11以上、Androidは4、ios safariは8以上
          // その他は最新2バージョンで必要なベンダープレフィックスを付与する
          //指定の内容はpackage.jsonに記入している
          cascade: false,
          grid: true
        })
      ])
    )
    .pipe(dest(srcPath.styles.dist, { sourcemaps: "./map" }))
    .pipe(browserSync.reload({ stream: true }))
    .pipe(notify({
        message: 'Sassをコンパイルしました！',
        onLast: true
      }))
};

//Sassの処理自動化（圧縮用）
const stylesCompress = () => {
  return src(srcPath.styles.src)
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(glob())
    .pipe(sass({ outputStyle: "compressed" }).on("error", sass.logError))
    .pipe(
      postcss([
        autoprefixer({
          //上の指定と同じ
          cascade: false,
          grid: true
        })
      ])
    )
    .pipe(
      rename({
        suffix: ".min"
      })
    )
    .pipe(dest(srcPath.styles.dist))
};

//JavaScriptの処理自動化（開発用）
const scriptFunc = () => {
  return (
    src(srcPath.scripts.src, { sourcemaps: true })
      .pipe(plumber({ errorHandler: notify.onError("Error: <%= error.message %>") }))
      .pipe(
        babel({
          presets: ["@babel/env"]
        })
      )
      .pipe(dest(srcPath.scripts.dist, { sourcemaps: "./map" }))
      .pipe(browserSync.reload({ stream: true }))
  );
};

//JavaScriptの処理自動化（圧縮用）
const scriptCompress = () => {
  return (
    src(srcPath.scripts.src)
      .pipe(plumber({ errorHandler: notify.onError("Error: <%= error.message %>") }))
      .pipe(
        babel({
          presets: ["@babel/env"]
        })
      )
      .pipe(uglify({ output: { comments: /^!/ } }))
      .pipe(
        rename({
          suffix: ".min"
        })
      )
      .pipe(dest(srcPath.scripts.dist))
  );
};

//画像圧縮の定義
const imagesBase = [
  pngquant({
    quality: [0.7, 0.85]
  }),
  mozjpeg({
    quality: 85
  }),
  imagemin.gifsicle(),
  //imagemin.jpegtran(), //最新だとjpegtranだとエラーになる
  imagemin.mozjpeg(),
  imagemin.optipng(),
  imagemin.svgo({
    plugins: [
      { removeViewBox: false },
      { removeMetadata: false },
      { removeUnknownsAndDefaults: false },
      { convertShapeToPath: false },
      { collapseGroups: false },
      { cleanupIDs: false }
    ]
  })
];

//画像の処理自動化
const imagesFunc = () => {
  return src(srcPath.images.src, { since: lastRun(imagesFunc) })
    .pipe(plumber({ errorHandler: notify.onError("<%= error.message %>") }))
    .pipe(imagemin(imagesBase))
    .pipe(dest(srcPath.images.dist));
};

// マップファイル除去
const cleanMap = () => {
  return del([srcPath.styles.map, srcPath.scripts.map]);
};

// ブラウザの読み込み処理
const browserSyncFunc = () => {
  browserSync({
    server: {
      baseDir: "../",
      index: "index.html"
    },
    reloadOnRestart: true
  });
};

// ファイルに変更があったら反映
const watchFiles = () => {
  watch(srcPath.html.src, htmlFunc);
  watch(srcPath.styles.src, stylesFunc);
  watch(srcPath.scripts.src, scriptFunc);
  watch(srcPath.images.src, imagesFunc);
};

exports.default = series(
    parallel(htmlFunc, stylesFunc, scriptFunc, imagesFunc), //出力するだけの設定
    parallel(watchFiles, browserSyncFunc)
);

// exports.default = parallel(watchFiles, browserSyncFunc); //初期設定（フォルダ、ファイルの監視、ブラウザへの反映）
// exports.build = parallel(htmlFunc, stylesFunc, scriptFunc, imagesFunc); //出力するだけの設定
// exports.compress = parallel(stylesCompress, scriptCompress, cleanMap); //cssとJavaScriptの圧縮、mapフォルダの削除