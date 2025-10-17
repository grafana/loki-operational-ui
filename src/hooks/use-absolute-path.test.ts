import { absolutePath } from './use-absolute-path';

// Mock window.location for testing
const mockLocation = (pathname: string) => {
  delete (window as unknown as { location?: Location }).location;
  (window as unknown as { location: { pathname: string } }).location = { pathname };
};

describe('use-absolute-path', () => {
  afterEach(() => {
    // Reset to a default location after each test
    mockLocation('/ui/');
  });

  describe('absolutePath', () => {
    it('constructs correct path for grafana datasource', () => {
      mockLocation('/grafana/a/grafana-lokioperational-app');
      expect(absolutePath('/api/v1/features', 'test-uid')).toBe(
        '/grafana/api/datasources/proxy/uid/test-uid/ui/api/v1/features'
      );
    });

    it('handles path without leading slash', () => {
      mockLocation('/a/grafana-lokioperational-app');
      expect(absolutePath('api/v1/goldfish/queries', 'test-uid')).toBe(
        '/api/datasources/proxy/uid/test-uid/ui/api/v1/goldfish/queries'
      );
    });

    it('handles location with trailing slash', () => {
      mockLocation('/grafana/a/grafana-lokioperational-app/');
      expect(absolutePath('api/v1/goldfish/queries', 'test-uid')).toBe(
        '/grafana/api/datasources/proxy/uid/test-uid/ui/api/v1/goldfish/queries'
      );
    });

    it('handles single level subpath in plugin', () => {
      mockLocation('/grafana/a/grafana-lokioperational-app/rings');
      expect(absolutePath('api/v1/goldfish/queries', 'test-uid')).toBe(
        '/grafana/api/datasources/proxy/uid/test-uid/ui/api/v1/goldfish/queries'
      );
    });

    it('handles multi level subpath in plugin', () => {
      mockLocation('/grafana/a/grafana-lokioperational-app/storage/object');
      expect(absolutePath('api/v1/goldfish/queries', 'test-uid')).toBe(
        '/grafana/api/datasources/proxy/uid/test-uid/ui/api/v1/goldfish/queries'
      );
    });

    it('handles empty path', () => {
      mockLocation('/grafana/a/grafana-lokioperational-app');
      expect(absolutePath('', 'test-uid')).toBe('/grafana/api/datasources/proxy/uid/test-uid/ui/');
    });

    it('handles root path', () => {
      mockLocation('/grafana/a/grafana-lokioperational-app');
      expect(absolutePath('/', 'test-uid')).toBe('/grafana/api/datasources/proxy/uid/test-uid/ui/');
    });
  });
});
