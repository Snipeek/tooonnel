const esbuild = require("esbuild");
const path = require("path");
const { spawn } = require('node:child_process');

const isProduction = !process.argv.includes('--watch');

const config = {
  entryPoints: {
    client: 'client.ts',
    server: 'server.ts',
  },
  outdir: './dist/',
  bundle: true,
  platform: "node",
  target: "node18",
  // minify: isProduction,
  logLevel: 'info',
  assetNames: 'assets/[name]',
  chunkNames: '[ext]/[name]-[hash]',
  plugins: [
    {
      name: 'rootdir',
      setup(build) {
        build.onResolve({ filter: /^\// }, args => ({ path: path.resolve('.' + args.path) }));
      },
    },
    !isProduction && ({
      name: 'starter',
      setup(build) {
        let child;
        build.onEnd(async (args) => {
          if (child) child.kill('SIGINT');

          child = spawn('yarn', ['start']);

          child.stdout.on('data', a => console.log('' + a));
          child.stderr.on('data', a => console.error('' + a));
        })
      }
    })
  ].filter(Boolean)
};

if (!isProduction)
  esbuild
      .context(config)
      .then(ctx => ctx.watch())
else
  esbuild
      .build(config)
