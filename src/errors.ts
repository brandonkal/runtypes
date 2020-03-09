export class ValidationError extends Error {
  public name: string = 'ValidationError';

  constructor(public message: string, public key?: string) {
    super(message);
    if (this.key) {
      this.message = `${message} for key ${key}`;
    }

    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
