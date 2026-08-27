import { validateProductionEnvironment } from '@/config/env';

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV === 'production') {
    try {
      validateProductionEnvironment(process.env);
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'Invalid production environment.');
      process.exit(1);
    }
  }
}
