// Jest setup provided by Grafana scaffolding
import './.config/jest-setup';

// Suppress React 18 act() warnings from third-party components
// These warnings are typically from Radix UI components (Popover, Select, etc.)
// that use timers and animations which are difficult to properly wrap in act()
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: An update to') || args[0].includes('inside a test was not wrapped in act'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
