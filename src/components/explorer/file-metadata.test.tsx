import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { FileMetadataView } from './file-metadata';
import { FileMetadataResponse, SectionMetadata } from 'types/explorer';
import '@testing-library/jest-dom';

function baseSection(overrides: Partial<SectionMetadata> = {}): SectionMetadata {
  return {
    type: 'SECTION_TYPE_INDEX_POINTERS',
    totalCompressedSize: 10,
    totalUncompressedSize: 20,
    columnCount: 1,
    columns: [
      {
        type: 'path',
        value_type: 'BINARY',
        rows_count: 1,
        compression: 'NONE',
        uncompressed_size: 10,
        compressed_size: 10,
        metadata_offset: 0,
        metadata_size: 0,
        values_count: 1,
        pages: [],
      },
    ],
    maxTimestamp: '2026-06-03T13:00:00Z',
    minTimestamp: '2026-06-03T12:00:00Z',
    distribution: [],
    ...overrides,
  };
}

function renderView(metadata: FileMetadataResponse) {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <FileMetadataView metadata={metadata} filename="index/v0/tocs/x.toc" downloadUrl="/dl" />
    </MemoryRouter>
  );
}

describe('FileMetadataView - index pointers', () => {
  it('renders a clickable pointer path when the section is expanded', async () => {
    const user = userEvent.setup();
    const metadata: FileMetadataResponse = {
      sections: [
        baseSection({
          indexPointers: [
            { path: 'index/v0/indexes/abc123.idx', start_ts: '2026-06-03T12:00:00Z', end_ts: '2026-06-03T13:00:00Z' },
          ],
        }),
      ],
      lastModified: '2026-06-03T13:00:00Z',
      minTimestamp: '2026-06-03T12:00:00Z',
      maxTimestamp: '2026-06-03T13:00:00Z',
      distribution: [],
    };

    renderView(metadata);
    await user.click(screen.getByText(/Section #1/));

    const link = screen.getByRole('link', { name: /index\/v0\/indexes\/abc123\.idx/ });
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('storage/dataobj/metadata?path=' + encodeURIComponent('index/v0/indexes/abc123.idx'))
    );
  });

  it('renders no pointer table when indexPointers is absent', async () => {
    const user = userEvent.setup();
    const metadata: FileMetadataResponse = {
      sections: [baseSection()],
      lastModified: '2026-06-03T13:00:00Z',
      minTimestamp: '2026-06-03T12:00:00Z',
      maxTimestamp: '2026-06-03T13:00:00Z',
      distribution: [],
    };

    renderView(metadata);
    await user.click(screen.getByText(/Section #1/));

    expect(screen.queryByText(/Index Pointers/i)).not.toBeInTheDocument();
  });

  it('renders no pointer table when indexPointers is an empty array', async () => {
    const user = userEvent.setup();
    const metadata: FileMetadataResponse = {
      sections: [baseSection({ indexPointers: [] })],
      lastModified: '2026-06-03T13:00:00Z',
      minTimestamp: '2026-06-03T12:00:00Z',
      maxTimestamp: '2026-06-03T13:00:00Z',
      distribution: [],
    };

    renderView(metadata);
    await user.click(screen.getByText(/Section #1/));

    expect(screen.queryByText(/Index Pointers/i)).not.toBeInTheDocument();
  });
});
