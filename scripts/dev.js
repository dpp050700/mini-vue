const minimist = require("minimist");
const path = require("path");

const args = minimist(process.argv.slice(2));

console.log(args);

const target = args._[0] || "reactivity";
const format = args.f || "global";

const entry = path.resolve(__dirname, `../packages/${target}/src/index.ts`);

const pkg = require(path.resolve(
  __dirname,
  `../packages/${target}/package.json`
));

// iife 自执行函数 global
// cjs  commonjs 规范
// esm  esModule

const outputFormat = format.startsWith("global")
  ? "iife"
  : format === "cjs"
  ? "cjs"
  : "esm";

const outputFile = path.resolve(
  __dirname,
  `../packages/${target}/dist/${target}.${format}.index.js`
);

const { build } = require("esbuild");

console.log(pkg.buildOptions.name);

build({
  entryPoints: [entry],
  outfile: outputFile,
  bundle: true,
  sourcemap: true,
  format: outputFormat,
  globalName: pkg.buildOptions.name,
  platform: format === "cjs" ? "node" : "browser",
  watch: {
    onRebuild(error) {
      if (!error) {
        console.log("rebuild~~~");
      }
    },
  },
}).then(() => {
  console.log("watching...");
});
