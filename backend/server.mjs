import { createApp } from './src/app.mjs';
import { environment } from './src/config/environment.mjs';
import { log, serializeError } from './src/infrastructure/logger.mjs';

const server = createApp();
server.on('error', error => {
  log('error', 'Server', 'Server error', { error: serializeError(error) });
  process.exitCode = 1;
});

server.listen(environment.port, () => {
  log('info', 'Server', 'Server started', {
    port: environment.port,
    environment: environment.isProduction ? 'production' : 'development',
  });
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, () => {
    log('info', 'Server', 'Shutting down', { signal });
    server.close(error => {
      if (error) {
        log('error', 'Server', 'Shutdown failed', { signal, error: serializeError(error) });
        process.exitCode = 1;
      } else {
        log('info', 'Server', 'Server stopped', { signal });
      }
    });
  });
}
