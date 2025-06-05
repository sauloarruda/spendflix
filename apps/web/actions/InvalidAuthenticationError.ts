export class InvalidAuthenticationError extends Error {
  cause: Error;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause as Error;
  }
}
