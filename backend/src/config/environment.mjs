import { loadEnvFile } from 'node:process';

if (process.env.NODE_ENV !== 'production') {
  try {
    loadEnvFile();
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

export const environment = {
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT || 8787),
};
