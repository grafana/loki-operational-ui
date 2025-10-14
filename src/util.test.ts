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
    it('extracts basename from standard /ui/ path', () => {
      mockLocation('/ui/');
      expect(getBasename()).toBe('/ui/');
    });

    it('extracts basename from nginx subpath with /ui/', () => {
      mockLocation('/loki-dev-005/ops/ui/some/path');
      expect(getBasename()).toBe('/loki-dev-005/ops/ui/');
    });

    it('returns default /ui/ when no match is found', () => {
      mockLocation('/some/random/path');
      expect(getBasename()).toBe('/ui/');
    });

    it('handles path ending with /ui/', () => {
      mockLocation('/loki-dev-ssd/ui/');
      expect(getBasename()).toBe('/loki-dev-ssd/ui/');
    });

    it('handles complex nginx paths', () => {
      mockLocation('/loki-live/ops/ui/features/goldfish');
      expect(getBasename()).toBe('/loki-live/ops/ui/');
    });
  });
});
