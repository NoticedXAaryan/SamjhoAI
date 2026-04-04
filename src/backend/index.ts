import { env } from './config/env.js';

function bootstrap(): void {
  // Step 1 scaffold only. HTTP server wiring lands in Step 2.
  console.info(`Backend scaffold ready on port ${env.PORT}`);
}

bootstrap();
