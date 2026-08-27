import { describe, expect, it } from 'vitest';
import {
  EnvironmentConfigurationError,
  validateBuildEnvironment,
  validateProductionEnvironment,
} from '../env';

const validProductionEnvironment = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://samjho:password@postgres:5432/samjho',
  BETTER_AUTH_SECRET: 'better-auth-secret-with-at-least-32-characters',
  BETTER_AUTH_URL: 'https://meet.example.com',
  GUEST_SESSION_SECRET: 'guest-session-secret-with-at-least-32-characters',
  LIVEKIT_API_KEY: 'samjho-key',
  LIVEKIT_API_SECRET: 'livekit-secret-with-at-least-32-characters',
  LIVEKIT_URL: 'http://livekit:7880',
  NEXT_PUBLIC_LIVEKIT_URL: 'wss://livekit.example.com',
};

describe('production environment validation', () => {
  it('accepts the documented production contract', () => {
    expect(validateProductionEnvironment(validProductionEnvironment)).toEqual(
      validProductionEnvironment,
    );
  });

  it('reports every invalid field without exposing secret values', () => {
    const invalidEnvironment = {
      ...validProductionEnvironment,
      DATABASE_URL: 'https://database.example.com',
      BETTER_AUTH_SECRET: 'short-secret',
      BETTER_AUTH_URL: 'ws://meet.example.com',
      GUEST_SESSION_SECRET: '',
      LIVEKIT_API_SECRET: 'another-short-secret',
      LIVEKIT_URL: 'wss://livekit.example.com',
      NEXT_PUBLIC_LIVEKIT_URL: 'https://livekit.example.com',
    };

    expect(() => validateProductionEnvironment(invalidEnvironment)).toThrow(
      EnvironmentConfigurationError,
    );

    try {
      validateProductionEnvironment(invalidEnvironment);
    } catch (error) {
      expect(error).toBeInstanceOf(EnvironmentConfigurationError);
      const message = (error as Error).message;
      expect(message).toContain('DATABASE_URL');
      expect(message).toContain('BETTER_AUTH_SECRET');
      expect(message).toContain('NEXT_PUBLIC_LIVEKIT_URL');
      expect(message).not.toContain('short-secret');
    }
  });

  it('requires build-time auth and browser configuration', () => {
    expect(() => validateBuildEnvironment({ NODE_ENV: 'production' })).toThrow(
      /BETTER_AUTH_SECRET[\s\S]*BETTER_AUTH_URL[\s\S]*NEXT_PUBLIC_LIVEKIT_URL/,
    );
    expect(() =>
      validateBuildEnvironment({
        NODE_ENV: 'production',
        BETTER_AUTH_SECRET: '',
        BETTER_AUTH_URL: '',
        NEXT_PUBLIC_LIVEKIT_URL: '',
      }),
    ).toThrow(EnvironmentConfigurationError);
  });

  it('does not require production values for development builds', () => {
    expect(validateBuildEnvironment({ NODE_ENV: 'development' })).toBeNull();
  });
});
