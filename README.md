# Loki Operational UI

A Grafana app plugin that provides an administrative console for operating and inspecting Grafana Loki clusters. It connects to Loki's internal APIs through the Grafana datasource proxy to surface operational information that is otherwise only available through CLI tools or raw HTTP endpoints.

**Requires:** Grafana >= 10.4.0 | **Access:** Admin users only

## Features

### Cluster Nodes

Browse all Loki cluster members with filtering by name, target type, and service state. Drill into individual nodes to view:

- Version and build info
- Service status distribution
- Live log level control (read/write)
- Pprof controls
- Full YAML configuration
- Analytics metrics and raw Prometheus metrics

### Ring Management

Inspect and manage all 10 Loki ring types (Ingester, Partition Ingester, Distributor, Compactor, Ruler, and more). View ring member state distribution, filter by ID/state/zone, and forget instances.

The Partition Ring view adds the ability to change partition states (Pending, Active, Inactive, Deleted).

### Data Objects Explorer

A file browser for Loki's data objects storage layer. Navigate folders, view file sizes, download files, and inspect detailed file metadata including sections, columns, page info, compression, and data distributions.

### Delete Requests

List and create Loki delete requests per tenant. View status, deleted line counts, and the originating LogQL query. The creation form includes live query validation and auto-formatting via Loki's `format_query` API.

### Analyze Labels

A label cardinality analysis tool. Given a tenant, time range, and optional matcher, it fetches stream series and shows total streams, unique labels, a bar chart of the top 20 labels, and a sortable table with cardinality percentages and sample values.

### Goldfish (Query Comparison)

Side-by-side performance comparison between two cells for sampled queries (from the query-tee). Includes filtering by outcome (match/mismatch/error), tenant, user, and new engine toggle, with paginated diff views and trace ID linking.

## Development

### Prerequisites

- Node.js
- Yarn
- Docker & Docker Compose (for local Grafana)

### Getting Started

```bash
# Install dependencies
yarn install

# Start development mode (watch)
yarn dev

# Run a local Grafana instance with the plugin loaded
yarn server

# Production build
yarn build
```

### Testing

```bash
# Unit tests (watch mode)
yarn test

# Unit tests (CI, single run)
yarn test:ci

# E2E tests (requires yarn server running)
yarn e2e
```

### Linting

```bash
yarn lint
yarn lint:fix
```
