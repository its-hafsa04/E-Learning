class ErrorHandler extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);   // Call the parent constructor with the error message
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor); // Capture the stack trace for debugging
  }
}

export default ErrorHandler;
