import { z } from 'zod';

type EnvironmentInput = Record<string, string | undefined>;

const secret = (name: string) =>
  z.string().min(32, `${name} must contain at least 32 characters`);

function usesProtocol(value: string, protocols: readonly string[]) {
  try {
    return protocols.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

const urlWithProtocols = (name: string, protocols: readonly string[]) =>
  z.string().url(`${name} must be a valid URL`).refine(
    (value) => usesProtocol(value, protocols),
    `${name} must use ${protocols.join(' or ')}`,
  );

const buildEnvironmentSchema = z.object({
  BETTER_AUTH_SECRET: secret('BETTER_AUTH_SECRET'),
  BETTER_AUTH_URL: urlWithProtocols('BETTER_AUTH_URL', ['http:', 'https:']),
  NEXT_PUBLIC_LIVEKIT_URL: urlWithProtocols('NEXT_PUBLIC_LIVEKIT_URL', ['ws:', 'wss:']),
});

const productionEnvironmentSchema = buildEnvironmentSchema.extend({
  NODE_ENV: z.literal('production'),
  DATABASE_URL: urlWithProtocols('DATABASE_URL', ['postgres:', 'postgresql:']),
  GUEST_SESSION_SECRET: secret('GUEST_SESSION_SECRET'),
  LIVEKIT_API_KEY: z.string().min(1, 'LIVEKIT_API_KEY is required'),
  LIVEKIT_API_SECRET: secret('LIVEKIT_API_SECRET'),
  LIVEKIT_URL: urlWithProtocols('LIVEKIT_URL', ['http:', 'https:']),
});

const liveKitEnvironmentSchema = productionEnvironmentSchema.pick({
  LIVEKIT_API_KEY: true,
  LIVEKIT_API_SECRET: true,
  LIVEKIT_URL: true,
});

export type ProductionEnvironment = z.infer<typeof productionEnvironmentSchema>;

export class EnvironmentConfigurationError extends Error {
  constructor(issues: z.core.$ZodIssue[]) {
    const details = issues
      .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
      .sort()
      .join('; ');
    super(`Invalid environment configuration: ${details}`);
    this.name = 'EnvironmentConfigurationError';
  }
}

function parseEnvironment<T>(schema: z.ZodType<T>, environment: EnvironmentInput): T {
  const result = schema.safeParse(environment);
  if (!result.success) {
    throw new EnvironmentConfigurationError(result.error.issues);
  }
  return result.data;
}

export function validateBuildEnvironment(environment: EnvironmentInput) {
  if (environment.NODE_ENV !== 'production') return null;
  return parseEnvironment(buildEnvironmentSchema, environment);
}

export function validateProductionEnvironment(
  environment: EnvironmentInput,
): ProductionEnvironment {
  return parseEnvironment(productionEnvironmentSchema, environment);
}

export function getAuthEnvironment(environment: EnvironmentInput = process.env) {
  if (environment.NODE_ENV !== 'production') {
    return {
      BETTER_AUTH_SECRET: environment.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: environment.BETTER_AUTH_URL,
    };
  }
  return parseEnvironment(buildEnvironmentSchema, environment);
}

export function getGuestSessionSecret(environment: EnvironmentInput = process.env) {
  const configured = environment.GUEST_SESSION_SECRET || environment.BETTER_AUTH_SECRET;
  return parseEnvironment(
    z.object({ secret: secret('GUEST_SESSION_SECRET or BETTER_AUTH_SECRET') }),
    { secret: configured },
  ).secret;
}

export function getLiveKitEnvironment(environment: EnvironmentInput = process.env) {
  return parseEnvironment(liveKitEnvironmentSchema, environment);
}
