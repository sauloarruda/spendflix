import '@testing-library/jest-dom';

// Suppress CSS parsing errors
const suppressedErrors = [
  /Could not parse CSS stylesheet/,
  /Not implemented: navigation \(except hash changes\)/,
];
const originalError = console.error;
console.error = (...args) => {
  if (suppressedErrors.some((pattern) => pattern.test(args[0]))) {
    return;
  }
  originalError(...args);
};
