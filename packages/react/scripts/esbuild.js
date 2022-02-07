// Based on the amazing Stiches team work https://github.com/modulz/stitches/tree/canary/.task
import esbuild from 'esbuild';
import nodemon from 'nodemon';
import zlib from 'zlib';
import { minify } from 'terser';

import * as fs from './internal/fs.js';
import * as js from './internal/js.js';
import URL from './internal/url.js';
import { box } from './internal/color.js';
import { isProcessMeta, getProcessArgOf } from './internal/process.js';

import { rootUrl as packageUrl } from './internal/dirs.js';

import { transformDestructuring } from './internal/js.transformDestructuring.js';
import { transformModulesToCJS } from './internal/js.transformModulesToCJS.js';
import { transformOptionalCatchToParam } from './internal/js.transformOptionalCatchToParam.js';

const variants = {
  esm: {
    extension: 'mjs',
    async transform(code, smap) {
      return await minify(code, {
        sourceMap: { content: smap },
        compress: true,
        module: true,
        mangle: true,
        toplevel: true
      });
    }
  },
  cjs: {
    extension: 'cjs',
    async transform(code, smap) {
      let cjsast = js.parse(code);

      transformModulesToCJS(cjsast);
      transformOptionalCatchToParam(cjsast);
      transformDestructuring(cjsast);

      return await minify(cjsast.toString(), {
        sourceMap: { content: smap },
        compress: true,
        module: true,
        mangle: true,
        toplevel: true
      });
    }
  }
};

export const build = async (opts) => {
  opts = Object.assign({ only: [] }, opts);
  const initPackageUrl = new URL('src/', packageUrl);
  const distPackageUrl = new URL('dist/', packageUrl);

  const packageJsonUrl = new URL(`package.json`, packageUrl);
  const packageName = JSON.parse(
    await fs.readFile(packageJsonUrl, 'utf8')
  ).name;

  if (!opts.only.length || opts.only.includes(packageName)) {
    const targetPathname = new URL('index.js', initPackageUrl).pathname;
    const outputPathname = new URL('index.js', distPackageUrl).pathname;

    // Build ESM version
    let {
      outputFiles: [{ text: smap }, { text: code }]
    } = await esbuild.build({
      entryPoints: [targetPathname],
      outfile: outputPathname,
      bundle: true,
      external: ['react', 'react-dom'],
      format: 'esm',
      sourcemap: 'external',
      write: false,
      treeShaking: true
    });

    // ensure empty dist directory
    await fs.mkdir(distPackageUrl, { recursive: true });

    // write map
    fs.writeFile(new URL(`index.map`, distPackageUrl), smap);

    // prepare variations
    const size = {
      name: packageName,
      types: {}
    };

    // write variation builds
    for (const variant in variants) {
      const variantInfo = variants[variant];
      const variantPath = new URL(
        `dist/index.${variantInfo.extension}`,
        packageUrl
      ).pathname;

      let { code: variantCode } = await variantInfo.transform(code, smap);

      const variantMins = (Buffer.byteLength(variantCode) / 1000).toFixed(2);
      const variantGzip = Number(
        zlib.gzipSync(variantCode, { level: 9 }).length / 1000
      ).toFixed(2);

      size.types[variant] = {
        min: variantMins,
        gzp: variantGzip
      };

      await fs.writeFile(
        variantPath,
        variantCode + `\n//# sourceMappingUrl=index.map`
      );
    }

    console.log(box(size));
  }
};

if (isProcessMeta(import.meta)) {
  if (getProcessArgOf('watch').includes(true)) {
    let onlyArgs = getProcessArgOf('only');

    onlyArgs = onlyArgs.length ? ['--only', ...onlyArgs] : onlyArgs;

    nodemon(
      [
        '-q',
        `--watch packages/react/src`,
        `--watch packages/react/tests`,
        `--watch packages/react/types`,

        // exec
        `--exec "${['node', './.task/build.js', ...onlyArgs].join(' ')}"`
      ].join(' ')
    )
      .on('start', () => {
        process.stdout.write('\u001b[3J\u001b[2J\u001b[1J');
        console.clear();
      })
      .on('quit', () => process.exit());
  } else {
    build({
      only: getProcessArgOf('only')
    }).catch((error) => {
      console.error(error);

      process.exitCode = 1;
    });
  }
}
