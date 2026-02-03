export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export function success<T>(data: T): ServiceResult<T> {
  return { success: true, data };
}

export function failure(error: string, code?: string): ServiceResult<never> {
  return { success: false, error, code };
}
