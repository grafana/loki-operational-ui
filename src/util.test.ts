import { getBasename } from './util';

// Mock window.location for testing
const mockLocation = (pathname: string) => {
  delete (window as unknown as { location?: Location }).location;
  (window as unknown as { location: { pathname: string } }).location = { pathname };
};

describe('util functions', () => {
  afterEach(() => {
    // Reset to a default location after each test
    mockLocation('/ui/');
  });

  describe('getBasename', () => {
    it('extracts basename from standard plugin path', () => {
      mockLocation('/a/grafana-lokioperational-app');
      expect(getBasename()).toBe('/');
    });

    it('extracts basename from nested plugin path', () => {
      mockLocation('/grafana/a/grafana-lokioperational-app');
      expect(getBasename()).toBe('/grafana/');
    });

    it('handles trailing slash', () => {
      mockLocation('/grafana/a/grafana-lokioperational-app/');
      expect(getBasename()).toBe('/grafana/');
    });

    it('returns default / when no match is found', () => {
      mockLocation('/some/random/path');
      expect(getBasename()).toBe('/');
    });
  });
});
