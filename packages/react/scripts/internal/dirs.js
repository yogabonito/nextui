import URL from './url.js';

/** Root directory. */
export const rootUrl = new URL('../../', import.meta.url);

/** Source directory. */
export const srcUrl = new URL('src/', rootUrl);

/** Types directory. */
export const typesUrl = new URL('types/', rootUrl);

/** Lib directory. */
export const libUrl = new URL('lib/', rootUrl);

/** UMD directory */
export const umdUrl = new URL('umd/', libUrl);

/** CJS directory */
export const cjsUrl = new URL('cjs/', libUrl);

/** ESM directory */
export const esmUrl = new URL('esm/', libUrl);
