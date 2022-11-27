export class UnauthorizedError extends Error {
  constructor() {
    super();

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }

  sayHello() {
    return 'hello ' + this.message;
  }
}
