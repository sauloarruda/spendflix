import '@testing-library/jest-dom';

// Suppress CSS parsing errors
const suppressedErrors = [
  /Could not parse CSS stylesheet/,
  /Not implemented: navigation \(except hash changes\)/,
  /inside a test was not wrapped in act/,
  /Test Error/,
  /Received .* for a non-boolean attribute .*/,
  /React does not recognize the .* prop on a DOM element/,
];
// eslint-disable-next-line no-console
const originalError = console.error;
// eslint-disable-next-line no-console
console.error = (...args) => {
  if (suppressedErrors.some((pattern) => pattern.test(args[0]))) {
    return;
  }
  originalError(...args);
};

// Mock chalk module
jest.mock('chalk', () => ({
  default: {
    magenta: (text: string) => text,
    red: (text: string) => text,
    green: (text: string) => text,
    yellow: (text: string) => text,
    blue: (text: string) => text,
    cyan: (text: string) => text,
    white: (text: string) => text,
    gray: (text: string) => text,
    black: (text: string) => text,
  },
}));
