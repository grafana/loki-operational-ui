import { fetchSampledQueries, fetchStoredResult, fetchGoldfishStats } from './goldfish-api';

// Mock the use-absolute-path module
jest.mock('../hooks/use-absolute-path', () => ({
  absolutePath: jest.fn(),
}));

import { absolutePath } from '../hooks/use-absolute-path';
const mockAbsolutePath = absolutePath as jest.MockedFunction<typeof absolutePath>;

// Mock tracing module to avoid random trace IDs in tests
jest.mock('./tracing', () => ({
  createTraceContext: jest.fn(() => ({
    traceId: 'test-trace-id-123',
    spanId: 'test-span-id-456',
  })),
  createTraceHeaders: jest.fn((traceId: string, spanId: string) => ({
    'X-Trace-Id': traceId,
    'X-Span-Id': spanId,
    traceparent: `00-${traceId}-${spanId}-01`,
  })),
  extractTraceId: jest.fn(() => 'test-trace-id-123'),
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window.location for testing
const mockLocation = (pathname: string) => {
  delete (window as unknown as { location?: Location }).location;
  (window as unknown as { location: { pathname: string } }).location = { pathname };
};

// Helper function to create standard expected headers
const expectedHeaders = {
  headers: {
    'X-Trace-Id': 'test-trace-id-123',
    'X-Span-Id': 'test-span-id-456',
    traceparent: '00-test-trace-id-123-test-span-id-456-01',
  },
};

// Helper function to create mock response
const mockResponse = (data: unknown = { queries: [], hasMore: false, page: 1, pageSize: 20 }) => ({
  ok: true,
  json: async () => data,
  headers: {
    get: jest.fn(() => null),
  },
});

describe('goldfish-api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation('/ui/');
  });

  describe('fetchSampledQueries API URL construction', () => {
    it('uses absolutePath to construct API URL for local development', async () => {
      // Setup: Mock absolutePath to return local development path
      mockAbsolutePath.mockReturnValue('/ui/api/v1/goldfish/queries');

      // Setup: Mock successful API response
      mockFetch.mockResolvedValueOnce(mockResponse());

      // Act: Call the API function
      await fetchSampledQueries('test-uid', 1, 20);

      // Assert: Verify absolutePath was called with correct relative path and datasource uid
      expect(mockAbsolutePath).toHaveBeenCalledWith('/api/v1/goldfish/queries', 'test-uid');

      // Assert: Verify fetch was called with the constructed URL and tracing headers
      expect(mockFetch).toHaveBeenCalledWith('/ui/api/v1/goldfish/queries?page=1&pageSize=20', expectedHeaders);
    });

    it('preserves query parameters when using absolutePath', async () => {
      // Setup: Mock absolutePath
      mockAbsolutePath.mockReturnValue('/base/api/v1/goldfish/queries');

      // Setup: Mock successful API response
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          queries: [],
          hasMore: true,
          page: 2,
          pageSize: 15,
        })
      );

      // Act: Call with specific parameters
      await fetchSampledQueries('test-uid', 2, 15);

      // Assert: Verify the complete URL with all query parameters and tracing headers
      expect(mockFetch).toHaveBeenCalledWith('/base/api/v1/goldfish/queries?page=2&pageSize=15', expectedHeaders);
    });

    it('handles API errors correctly', async () => {
      // Setup: Mock absolutePath
      mockAbsolutePath.mockReturnValue('/ui/api/v1/goldfish/queries');

      // Setup: Mock API error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
        text: async () => '',
        headers: {
          get: jest.fn(() => null),
        },
      });

      // Act & Assert: Verify function returns error instead of throwing
      const result = await fetchSampledQueries('test-uid', 1, 20);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Failed to fetch sampled queries: Internal Server Error');
      expect(result.traceId).toBe('test-trace-id-123');

      // Assert: Verify absolutePath was still called
      expect(mockAbsolutePath).toHaveBeenCalledWith('/api/v1/goldfish/queries', 'test-uid');
    });
  });

  describe('filter parameters', () => {
    beforeEach(() => {
      mockAbsolutePath.mockReturnValue('/ui/api/v1/goldfish/queries');
    });

    it('includes tenant filter in query parameters', async () => {
      // Setup: Mock successful API response
      mockFetch.mockResolvedValueOnce(mockResponse());

      // Act: Call with tenant filter
      await fetchSampledQueries('test-uid', 1, 20, 'tenant-123');

      // Assert: Verify URL includes tenant parameter and tracing headers
      expect(mockFetch).toHaveBeenCalledWith(
        '/ui/api/v1/goldfish/queries?page=1&pageSize=20&tenant=tenant-123',
        expectedHeaders
      );
    });

    it('includes user filter in query parameters', async () => {
      // Setup: Mock successful API response
      mockFetch.mockResolvedValueOnce(mockResponse());

      // Act: Call with user filter
      await fetchSampledQueries('test-uid', 1, 20, undefined, 'alice');

      // Assert: Verify URL includes user parameter and tracing headers
      expect(mockFetch).toHaveBeenCalledWith(
        '/ui/api/v1/goldfish/queries?page=1&pageSize=20&user=alice',
        expectedHeaders
      );
    });

    it('includes newEngine filter when true', async () => {
      // Setup: Mock successful API response
      mockFetch.mockResolvedValueOnce(mockResponse());

      // Act: Call with newEngine filter set to true
      await fetchSampledQueries('test-uid', 1, 20, undefined, undefined, true);

      // Assert: Verify URL includes newEngine=true parameter and tracing headers
      expect(mockFetch).toHaveBeenCalledWith(
        '/ui/api/v1/goldfish/queries?page=1&pageSize=20&newEngine=true',
        expectedHeaders
      );
    });

    it('includes newEngine filter when false', async () => {
      // Setup: Mock successful API response
      mockFetch.mockResolvedValueOnce(mockResponse());

      // Act: Call with newEngine filter set to false
      await fetchSampledQueries('test-uid', 1, 20, undefined, undefined, false);

      // Assert: Verify URL includes newEngine=false parameter and tracing headers
      expect(mockFetch).toHaveBeenCalledWith(
        '/ui/api/v1/goldfish/queries?page=1&pageSize=20&newEngine=false',
        expectedHeaders
      );
    });

    it('combines multiple filters correctly', async () => {
      // Setup: Mock successful API response
      mockFetch.mockResolvedValueOnce(mockResponse());

      // Act: Call with all filters
      await fetchSampledQueries('test-uid', 2, 50, 'tenant-b', 'bob', true);

      // Assert: Verify URL includes all parameters and tracing headers
      expect(mockFetch).toHaveBeenCalledWith(
        '/ui/api/v1/goldfish/queries?page=2&pageSize=50&tenant=tenant-b&user=bob&newEngine=true',
        expectedHeaders
      );
    });

    it('omits tenant parameter when value is "all"', async () => {
      // Setup: Mock successful API response
      mockFetch.mockResolvedValueOnce(mockResponse());

      // Act: Call with tenant set to "all"
      await fetchSampledQueries('test-uid', 1, 20, 'all');

      // Assert: Verify URL doesn't include tenant parameter but includes tracing headers
      expect(mockFetch).toHaveBeenCalledWith('/ui/api/v1/goldfish/queries?page=1&pageSize=20', expectedHeaders);
    });

    it('omits user parameter when value is "all"', async () => {
      // Setup: Mock successful API response
      mockFetch.mockResolvedValueOnce(mockResponse());

      // Act: Call with user set to "all"
      await fetchSampledQueries('test-uid', 1, 20, undefined, 'all');

      // Assert: Verify URL doesn't include user parameter but includes tracing headers
      expect(mockFetch).toHaveBeenCalledWith('/ui/api/v1/goldfish/queries?page=1&pageSize=20', expectedHeaders);
    });

    it('includes from and to time range parameters', async () => {
      // Setup: Mock successful API response
      mockFetch.mockResolvedValueOnce(mockResponse());

      const from = new Date('2023-01-01T10:00:00Z');
      const to = new Date('2023-01-01T11:00:00Z');

      // Act: Call with time range filters
      await fetchSampledQueries('test-uid', 1, 20, undefined, undefined, undefined, undefined, from, to);

      // Assert: Verify URL includes time parameters and tracing headers
      expect(mockFetch).toHaveBeenCalledWith(
        '/ui/api/v1/goldfish/queries?page=1&pageSize=20&from=2023-01-01T10%3A00%3A00.000Z&to=2023-01-01T11%3A00%3A00.000Z',
        expectedHeaders
      );
    });

    it('does not include comparisonStatus parameter when all', async () => {
      // Setup: Mock successful API response
      mockFetch.mockResolvedValueOnce(mockResponse());

      // Act: Call with comparisonStatus parameter of 'all'
      await fetchSampledQueries('test-uid', 1, 20, undefined, undefined, undefined, 'all');

      // Assert: Verify URL includes time parameters and tracing headers
      expect(mockFetch).toHaveBeenCalledWith('/ui/api/v1/goldfish/queries?page=1&pageSize=20', expectedHeaders);
    });

    it('includes comparisonStatus parameter when not all', async () => {
      // Setup: Mock successful API response
      mockFetch.mockResolvedValueOnce(mockResponse());

      // Act: Call with comparisonStatus parameter of 'match'
      await fetchSampledQueries('test-uid', 1, 20, undefined, undefined, undefined, 'match');

      // Assert: Verify URL includes time parameters and tracing headers
      expect(mockFetch).toHaveBeenCalledWith(
        '/ui/api/v1/goldfish/queries?page=1&pageSize=20&comparisonStatus=match',
        expectedHeaders
      );
    });
  });

  describe('real-world nginx scenarios', () => {
    it('works correctly in namespaced nginx environment', async () => {
      // Setup: Mock nginx environment
      mockLocation('/namespace/ops/ui/goldfish');
      mockAbsolutePath.mockReturnValue('/namespace/ops/ui/api/v1/goldfish/queries');

      // Setup: Mock successful response
      mockFetch.mockResolvedValueOnce(mockResponse());

      // Act: Make API call
      await fetchSampledQueries('test-uid');

      // Assert: Verify correct nginx-prefixed URL is used with tracing headers
      expect(mockFetch).toHaveBeenCalledWith(
        '/namespace/ops/ui/api/v1/goldfish/queries?page=1&pageSize=20',
        expectedHeaders
      );
    });
  });

  describe('fetchStoredResult', () => {
    beforeEach(() => {
      mockAbsolutePath.mockReturnValue('/ui/api/v1/goldfish/results');
    });

    describe('successful fetches', () => {
      it('fetches stored result for cell a', async () => {
        // Setup: Mock successful response with JSON data
        const testData = '{"streams": [{"labels": "test"}]}';
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => testData,
          headers: {
            get: jest.fn(() => null),
          },
        });

        // Act: Fetch cell a data
        const result = await fetchStoredResult('test-uid', 'correlation-123', 'a');

        // Assert: Verify successful response
        expect(result.data).toBe(testData);
        expect(result.error).toBeUndefined();
        expect(result.traceId).toBe('test-trace-id-123');
      });
    });

    describe('URL construction', () => {
      it('constructs correct API URL for cell a', async () => {
        // Setup: Mock absolutePath to return expected path
        mockAbsolutePath.mockReturnValue('/ui/api/v1/goldfish/results/corr-123/cell-a');

        // Setup: Mock successful response
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => '{}',
          headers: {
            get: jest.fn(() => null),
          },
        });

        // Act: Call fetchStoredResult
        await fetchStoredResult('test-uid', 'corr-123', 'a');

        // Assert: Verify absolutePath was called with correct parameters
        expect(mockAbsolutePath).toHaveBeenCalledWith('/api/v1/goldfish/results/corr-123/cell-a', 'test-uid');

        // Assert: Verify fetch was called with constructed URL and tracing headers
        expect(mockFetch).toHaveBeenCalledWith('/ui/api/v1/goldfish/results/corr-123/cell-a', expectedHeaders);
      });

      it('constructs correct API URL for cell b', async () => {
        // Setup: Mock absolutePath to return expected path
        mockAbsolutePath.mockReturnValue('/ui/api/v1/goldfish/results/corr-456/cell-b');

        // Setup: Mock successful response
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => '{}',
          headers: {
            get: jest.fn(() => null),
          },
        });

        // Act: Call fetchStoredResult
        await fetchStoredResult('test-uid', 'corr-456', 'b');

        // Assert: Verify absolutePath was called with correct parameters
        expect(mockAbsolutePath).toHaveBeenCalledWith('/api/v1/goldfish/results/corr-456/cell-b', 'test-uid');

        // Assert: Verify fetch was called with constructed URL and tracing headers
        expect(mockFetch).toHaveBeenCalledWith('/ui/api/v1/goldfish/results/corr-456/cell-b', expectedHeaders);
      });
    });

    describe('error handling', () => {
      it('handles API errors', async () => {
        // Setup: Mock API error response with JSON
        mockFetch.mockResolvedValueOnce({
          ok: false,
          statusText: 'Not Found',
          text: async () => '{"error": "Stored result not found for correlation ID"}',
          headers: {
            get: jest.fn(() => null),
          },
        });

        // Act: Call fetchStoredResult
        const result = await fetchStoredResult('test-uid', 'missing-id', 'a');

        // Assert: Verify error is returned with parsed JSON message
        expect(result.error).toBeDefined();
        expect(result.error?.message).toBe('Stored result not found for correlation ID');
        expect(result.data).toBeUndefined();
        expect(result.traceId).toBe('test-trace-id-123');
      });
    });
  });

  describe('fetchGoldfishStats', () => {
    beforeEach(() => {
      mockAbsolutePath.mockReturnValue('/ui/api/v1/goldfish/stats');
    });

    describe('successful fetches', () => {
      it('fetches statistics successfully', async () => {
        // Setup: Mock successful response with statistics data
        const statsData = {
          queriesExecuted: 100,
          engineCoverage: 0.75,
          matchingQueries: 0.95,
          performanceDifference: -0.05,
        };
        mockFetch.mockResolvedValueOnce(mockResponse(statsData));

        // Act: Fetch statistics
        const result = await fetchGoldfishStats('test-uid');

        // Assert: Verify successful response
        expect(result.data).toEqual(statsData);
        expect(result.error).toBeUndefined();
        expect(result.traceId).toBe('test-trace-id-123');
      });

      it('constructs correct API URL', async () => {
        // Setup: Mock successful response
        mockFetch.mockResolvedValueOnce(
          mockResponse({
            queriesExecuted: 50,
            engineCoverage: 0.5,
            matchingQueries: 0.9,
            performanceDifference: 0.1,
          })
        );

        // Act: Call fetchGoldfishStats
        await fetchGoldfishStats('test-uid');

        // Assert: Verify absolutePath was called with correct parameters
        expect(mockAbsolutePath).toHaveBeenCalledWith('/api/v1/goldfish/stats', 'test-uid');

        // Assert: Verify fetch was called with constructed URL and tracing headers
        expect(mockFetch).toHaveBeenCalledWith('/ui/api/v1/goldfish/stats', expectedHeaders);
      });
    });

    describe('filter parameters', () => {
      it('includes from and to time range parameters', async () => {
        // Setup: Mock successful API response
        mockFetch.mockResolvedValueOnce(
          mockResponse({
            queriesExecuted: 30,
            engineCoverage: 0.7,
            matchingQueries: 0.92,
            performanceDifference: -0.1,
          })
        );

        const from = new Date('2023-01-01T10:00:00Z');
        const to = new Date('2023-01-01T11:00:00Z');

        // Act: Call with time range filters
        await fetchGoldfishStats('test-uid', from, to);

        // Assert: Verify URL includes time parameters and tracing headers
        expect(mockFetch).toHaveBeenCalledWith(
          '/ui/api/v1/goldfish/stats?from=2023-01-01T10%3A00%3A00.000Z&to=2023-01-01T11%3A00%3A00.000Z',
          expectedHeaders
        );
      });
    });

    describe('error handling', () => {
      it('handles API errors with JSON response', async () => {
        // Setup: Mock API error response with JSON
        mockFetch.mockResolvedValueOnce({
          ok: false,
          statusText: 'Internal Server Error',
          text: async () => '{"error": "Failed to compute statistics"}',
          headers: {
            get: jest.fn(() => null),
          },
        });

        // Act: Call fetchGoldfishStats
        const result = await fetchGoldfishStats('test-uid');

        // Assert: Verify error is returned with parsed JSON message
        expect(result.error).toBeDefined();
        expect(result.error?.message).toBe('Failed to compute statistics');
        expect(result.data).toBeUndefined();
        expect(result.traceId).toBe('test-trace-id-123');
      });

      it('handles API errors with plain text response', async () => {
        // Setup: Mock API error response with plain text
        mockFetch.mockResolvedValueOnce({
          ok: false,
          statusText: 'Bad Gateway',
          text: async () => 'Service temporarily unavailable',
          headers: {
            get: jest.fn(() => null),
          },
        });

        // Act: Call fetchGoldfishStats
        const result = await fetchGoldfishStats('test-uid');

        // Assert: Verify error is returned with plain text message
        expect(result.error).toBeDefined();
        expect(result.error?.message).toBe('Service temporarily unavailable');
        expect(result.data).toBeUndefined();
        expect(result.traceId).toBe('test-trace-id-123');
      });

      it('handles network errors', async () => {
        // Setup: Mock network error
        const networkError = new Error('Network request failed');
        mockFetch.mockRejectedValueOnce(networkError);

        // Act: Call fetchGoldfishStats
        const result = await fetchGoldfishStats('test-uid');

        // Assert: Verify error is returned with network error message
        expect(result.error).toBeDefined();
        expect(result.error?.message).toBe('Network request failed');
        expect(result.data).toBeUndefined();
        expect(result.traceId).toBe('test-trace-id-123');
      });
    });

    describe('AbortController support', () => {
      it('passes abort signal to fetch', async () => {
        // Setup: Mock successful response
        mockFetch.mockResolvedValueOnce(
          mockResponse({
            queriesExecuted: 100,
            engineCoverage: 0.75,
            matchingQueries: 0.95,
            performanceDifference: -0.05,
          })
        );

        // Act: Call with AbortSignal
        const abortController = new AbortController();
        await fetchGoldfishStats('test-uid', undefined, undefined, abortController.signal);

        // Assert: Verify fetch was called with signal in options
        expect(mockFetch).toHaveBeenCalledWith(
          '/ui/api/v1/goldfish/stats',
          expect.objectContaining({
            signal: abortController.signal,
          })
        );
      });

      it('handles aborted requests', async () => {
        // Setup: Mock abort error
        const abortError = new Error('The operation was aborted');
        abortError.name = 'AbortError';
        mockFetch.mockRejectedValueOnce(abortError);

        // Act: Call with AbortSignal that will be aborted
        const abortController = new AbortController();
        const result = await fetchGoldfishStats('test-uid', undefined, undefined, abortController.signal);

        // Assert: Verify error is returned (AbortError is treated like any other error)
        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain('aborted');
        expect(result.traceId).toBe('test-trace-id-123');
      });
    });
  });
});
