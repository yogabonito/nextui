import setupPackage from './setup-package';
import path from 'path';
import fse from 'fs-extra';
import { shell } from './utils';
import { step } from './utils';
import { error } from './utils';

const libRoot = path.join(__dirname, '../lib');
const rootDir = path.join(__dirname, '../');

const buildPkg = step('build pkg...', () => shell(`yarn build`));

const printPkg = step('print pkg...', () => {
  const genPkgJson = fse
    .readFileSync(`${libRoot}/package.json`)
    .toString('utf-8');
  console.log(JSON.parse(genPkgJson));
});

const copyFromRoot = (file) =>
  fse.copySync(`${rootDir}/${file}`, `${libRoot}/${file}`, { overwrite: true });

Promise.resolve(true)
  .then(buildPkg)
  .then(() => {
    setupPackage();
    printPkg();
    copyFromRoot('README.md');
    copyFromRoot('LICENSE');
  })
  .catch(error);
