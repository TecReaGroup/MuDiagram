import { fileURLToPath } from 'node:url';

export const paths = {
  distRoot: fileURLToPath(new URL('../../../dist/', import.meta.url)),
  logRoot: fileURLToPath(new URL('../../data/log/', import.meta.url)),
};
