import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { StatsBar } from './stats-bar';
import { fetchGoldfishStats } from 'lib/goldfish-api';
import '@testing-library/jest-dom';

// Mock the goldfish-api module
jest.mock('lib/goldfish-api', () => ({
  fetchGoldfishStats: jest.fn(),
}));

const mockFetchGoldfishStats = fetchGoldfishStats as jest.MockedFunction<typeof fetchGoldfishStats>;

describe('StatsBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering states', () => {
    it('shows loading state initially', () => {
      // Setup: Mock that never resolves to keep component in loading state
      mockFetchGoldfishStats.mockImplementation(() => new Promise(() => { }));

      // Act: Render component
      const { container } = render(<StatsBar datasourceUid="test-uid" />);

      // Assert: Should show 4 skeleton loaders (one for each stat card)
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(4);
    });

    it('displays error alert when fetch fails', async () => {
      // Setup: Mock fetch to return error
      mockFetchGoldfishStats.mockResolvedValueOnce({
        error: new Error('boom'),
        traceId: 'test-trace-id',
      });

      // Act: Render component
      render(<StatsBar datasourceUid="test-uid" />);

      // Assert: Error alert should be displayed
      await waitFor(() => {
        expect(screen.getByText(/Failed to load statistics/i)).toBeInTheDocument();
        expect(screen.getByText(/boom/i)).toBeInTheDocument();
      });
    });

    it('displays stat cards with formatted data on success', async () => {
      // Setup: Mock successful fetch
      mockFetchGoldfishStats.mockResolvedValueOnce({
        data: {
          queriesExecuted: 1000,
          engineCoverage: 0.75,
          matchingQueries: 0.95,
          performanceDifference: -0.05,
        },
        traceId: 'test-trace-id',
      });

      // Act: Render component
      render(<StatsBar datasourceUid="test-uid" />);

      // Assert: Stat cards should display formatted values
      await waitFor(() => {
        expect(screen.getByText('1,000 queries')).toBeInTheDocument();
        expect(screen.getByText('75.0%')).toBeInTheDocument();
        expect(screen.getByText('95.0%')).toBeInTheDocument();
        expect(screen.getByText('-5%')).toBeInTheDocument(); // performanceDifference with sign (negative = faster)
      });

      // Assert: Labels should be present
      expect(screen.getByText('Queries executed')).toBeInTheDocument();
      expect(screen.getByText('Engine coverage')).toBeInTheDocument();
      expect(screen.getByText('Matching queries')).toBeInTheDocument();
      expect(screen.getByText(/Performance difference/i)).toBeInTheDocument();
    });

    it('does not fetch when datasourceUid is not provided', () => {
      // Setup: Mock fetch (should not be called)
      mockFetchGoldfishStats.mockResolvedValueOnce({
        data: {
          queriesExecuted: 100,
          engineCoverage: 0.8,
          matchingQueries: 0.9,
          performanceDifference: 0.1,
        },
        traceId: 'test-trace-id',
      });

      // Act: Render without datasourceUid
      const { container } = render(<StatsBar datasourceUid="" />);

      // Assert: Component shows loading state but doesn't fetch
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(4);
      expect(mockFetchGoldfishStats).not.toHaveBeenCalled();
    });
  });

  describe('API integration', () => {
    it('calls fetchGoldfishStats with correct parameters', async () => {
      // Setup: Mock successful fetch
      mockFetchGoldfishStats.mockResolvedValueOnce({
        data: {
          queriesExecuted: 50,
          engineCoverage: 0.6,
          matchingQueries: 0.85,
          performanceDifference: 0.02,
        },
        traceId: 'test-trace-id',
      });

      const from = new Date('2023-01-01T10:00:00Z');
      const to = new Date('2023-01-01T11:00:00Z');

      // Act: Render with all parameters
      render(<StatsBar datasourceUid="test-uid" from={from} to={to} />);

      // Assert: fetchGoldfishStats should be called with correct arguments
      await waitFor(() => {
        expect(mockFetchGoldfishStats).toHaveBeenCalledWith(
          'test-uid',
          from,
          to,
          expect.any(Object) // AbortSignal
        );
      });
    });

    it('refetches when filters change', async () => {
      // Setup: Mock successful fetch
      mockFetchGoldfishStats.mockResolvedValue({
        data: {
          queriesExecuted: 50,
          engineCoverage: 0.6,
          matchingQueries: 0.85,
          performanceDifference: 0.02,
        },
        traceId: 'test-trace-id',
      });

      const from1 = new Date('2023-01-01T10:00:00Z');
      const from2 = new Date('2023-01-02T10:00:00Z');

      // Act: Initial render
      const { rerender } = render(<StatsBar datasourceUid="test-uid" from={from1} />);

      await waitFor(() => {
        expect(mockFetchGoldfishStats).toHaveBeenCalledTimes(1);
      });

      // Act: Change from filter
      rerender(<StatsBar datasourceUid="test-uid" from={from2} />);

      // Assert: Should trigger another fetch
      await waitFor(() => {
        expect(mockFetchGoldfishStats).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('AbortController support', () => {
    it('aborts fetch on unmount', async () => {
      // Setup: Spy on AbortController.abort
      const abortSpy = jest.spyOn(AbortController.prototype, 'abort');

      // Setup: Mock successful fetch
      mockFetchGoldfishStats.mockResolvedValueOnce({
        data: {
          queriesExecuted: 100,
          engineCoverage: 0.75,
          matchingQueries: 0.95,
          performanceDifference: -0.05,
        },
        traceId: 'test-trace-id',
      });

      // Act: Render and unmount
      const { unmount } = render(<StatsBar datasourceUid="test-uid" />);
      unmount();

      // Assert: abort should have been called
      expect(abortSpy).toHaveBeenCalled();

      // Cleanup
      abortSpy.mockRestore();
    });

    it('aborts previous fetch when dependencies change', async () => {
      // Setup: Spy on AbortController.abort
      const abortSpy = jest.spyOn(AbortController.prototype, 'abort');

      // Setup: Mock successful fetch
      mockFetchGoldfishStats.mockResolvedValue({
        data: {
          queriesExecuted: 100,
          engineCoverage: 0.75,
          matchingQueries: 0.95,
          performanceDifference: -0.05,
        },
        traceId: 'test-trace-id',
      });

      const from1 = new Date('2023-01-01T10:00:00Z');
      const from2 = new Date('2023-01-02T10:00:00Z');

      // Act: Initial render
      const { rerender } = render(<StatsBar datasourceUid="test-uid" from={from1} />);

      await waitFor(() => {
        expect(mockFetchGoldfishStats).toHaveBeenCalledTimes(1);
      });

      // Act: Change from date (should trigger abort of previous request)
      rerender(<StatsBar datasourceUid="test-uid" from={from2} />);

      // Assert: abort should have been called when dependencies changed
      await waitFor(() => {
        expect(abortSpy).toHaveBeenCalled();
      });

      // Cleanup
      abortSpy.mockRestore();
    });
  });
});
