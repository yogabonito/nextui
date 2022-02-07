import chalkPkg from 'chalk';
const { green } = chalkPkg;

import webpack from 'webpack';

import fse from 'fs-extra';

import { cherryPick } from './cherry-pick.js';
import getConfig from '../buildconfig/webpack.config.js';

const targets = process.argv.slice(2);

import {
  srcUrl,
  typesUrl,
  libUrl,
  umdUrl,
  cjsUrl,
  esmUrl
} from './internal/dirs.js';

const srcRoot = srcUrl.pathname;
const typesRoot = typesUrl.pathname;

const libRoot = libUrl.pathname;
const umdRoot = umdUrl.pathname;
const cjsRoot = cjsUrl.pathname;
const esRoot = esmUrl.pathname;

import { step, shell, error } from './utils.js';

const clean = () => fse.existsSync(libRoot) && fse.removeSync(libRoot);

const has = (t) => !targets.length || targets.includes(t);

const buildTypes = step('generating .d.ts', () => shell(`yarn build:types`));

const copyTypes = (dest) => fse.copySync(typesRoot, dest, { overwrite: true });

const babel = (outDir, envName) => {
  shell(
    `yarn babel ${srcRoot} -x .js,.jsx,.ts,.tsx --out-dir ${outDir} --env-name "${envName} --no-comments"`
  );
};

/**
 * Run babel over the src directory and output
 * compiled common js files to ./lib.
 */
const buildLib = step('commonjs modules', async () => {
  await babel(cjsRoot, 'cjs');
  await copyTypes(cjsRoot);
});

/**
 * Run babel over the src directory and output
 * compiled es modules (but otherwise es5) to /es
 */
const buildEsm = step('es modules', async () => {
  await babel(esRoot, 'esm');
  await copyTypes(esRoot);
});

/**
 * Bundles a minified and unminified version of nextui including
 * all it's immediate dependencies (excluding React, ReactDOM, etc)
 */
const buildUmd = step(
  'browser distributable',
  () =>
    new Promise((resolve, reject) => {
      webpack(
        [getConfig(umdRoot, false), getConfig(umdRoot, true)],
        async (err, stats) => {
          if (err || stats.hasErrors()) {
            reject(err || stats.toJson().errors);
            return;
          }

          resolve();
        }
      );
    })
);

const buildDirectories = step('Linking directories', () =>
  cherryPick({
    inputDir: '../src/**',
    cjsDir: 'cjs',
    esmDir: 'esm',
    cwd: libRoot
  })
);

console.log(
  green(`Building targets: ${targets.length ? targets.join(', ') : 'all'}\n`)
);

clean();

Promise.resolve(true)
  .then(buildTypes)
  .then(() =>
    Promise.all([
      has('lib') && buildLib(),
      has('es') && buildEsm(),
      has('umd') && buildUmd()
    ])
  )
  .then(buildDirectories)
  .catch(error);
