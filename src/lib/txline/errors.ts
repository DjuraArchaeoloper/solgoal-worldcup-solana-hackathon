export type TxlineErrorCode =
  | "CONFIG_MISSING"
  | "AUTH_FAILED"
  | "REQUEST_FAILED"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "INVALID_RESPONSE"
  | "TRANSFORM_FAILED";

export class TxlineError extends Error {
  code: TxlineErrorCode;
  status?: number;

  constructor(message: string, code: TxlineErrorCode, status?: number) {
    super(message);
    this.name = "TxlineError";
    this.code = code;
    this.status = status;
  }
}

export function isTxlineError(error: unknown): error is TxlineError {
  return error instanceof TxlineError;
}

function messageFor(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export const txlineLogger = {
  debug(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[TxLINE] ${message}`, meta ?? "");
    }
  },
  warn(message: string, error?: unknown) {
    console.warn(`[TxLINE] ${message}`, error ? messageFor(error) : "");
  },
  error(message: string, error?: unknown) {
    console.error(`[TxLINE] ${message}`, error ? messageFor(error) : "");
  },
};
