/**
 * Result Pattern Implementation
 * SRP: Explicit error handling without exceptions
 * Following Functional Programming principles
 */

export class Result {
  constructor(ok, value, error) {
    this.ok = ok;
    this.value = value;
    this.error = error;
  }

  isOk() {
    return this.ok;
  }

  isErr() {
    return !this.ok;
  }

  getValue() {
    if (!this.ok) {
      throw new Error('Cannot get value from error result');
    }
    return this.value;
  }

  getError() {
    if (this.ok) {
      throw new Error('Cannot get error from success result');
    }
    return this.error;
  }

  map(fn) {
    if (this.ok) {
      return Result.ok(fn(this.value));
    }
    return this;
  }

  flatMap(fn) {
    if (this.ok) {
      return fn(this.value);
    }
    return this;
  }

  static ok(value) {
    return new Result(true, value, null);
  }

  static err(error) {
    return new Result(false, null, error);
  }
}

export class AsyncResult {
  static async from(promise) {
    try {
      const value = await promise;
      return Result.ok(value);
    } catch (error) {
      return Result.err(error.message || error);
    }
  }
}
