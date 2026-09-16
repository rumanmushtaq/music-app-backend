import { QueryFailedError } from 'typeorm';

const POSTGRES_UNIQUE_VIOLATION = '23505';

export function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }
  const driverError = error as unknown as { code?: string; driverError?: { code?: string } };
  const code = driverError.driverError?.code ?? driverError.code;
  return code === POSTGRES_UNIQUE_VIOLATION;
}
