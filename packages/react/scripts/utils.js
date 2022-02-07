import pkg from 'chalk';
const { green, cyan, red } = pkg;

import execa from 'execa';

export const step = (name, fn) => async () => {
  console.log(cyan('Building: ') + green(name));
  await fn();
  console.log(cyan('Built: ') + green(name));
};

export const shell = (cmd) =>
  execa(cmd, { stdio: ['pipe', 'pipe', 'inherit'], shell: true });

export const error = (err) => {
  if (err && Array.isArray(err))
    console.log(red(err.map((e) => e.message).join('\n')));
  if (err && typeof err === 'object')
    console.error(red(err.stack || err.toString()));
  process.exit(1);
};
