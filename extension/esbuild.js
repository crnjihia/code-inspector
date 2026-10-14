const esbuild = require('esbuild');
const path = require('path');

const isWatch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: [path.join(__dirname, 'src', 'extension.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  external: ['vscode'],
  outfile: path.join(__dirname, 'dist', 'extension.js'),
  sourcemap: true,
  minify: process.argv.includes('--minify'),
  format: 'cjs'
};

async function run() {
  if (isWatch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    await esbuild.build(buildOptions);
    console.log('Build complete');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
