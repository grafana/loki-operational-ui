# Loki Operational UI

![Grafana](https://img.shields.io/badge/Grafana-App%20plugin-F47A20?logo=grafana&logoColor=white)
![Grafana dependency](https://img.shields.io/badge/Grafana-%E2%89%A510.4.0-F47A20?logo=grafana&logoColor=white)
![License](https://img.shields.io/badge/License-Apache--2.0-blue)

Loki Operational UI is a Grafana **app plugin** that provides an **admin-only** operational console for Grafana Loki clusters: cluster/node status, ring inspection and actions, storage exploration, tenant tooling, and a “Goldfish” query comparison workflow.

## Overview

This plugin is intended for Loki operators who want a single place inside Grafana to:

- Inspect **cluster members** and their services/health
- Browse and act on **rings** (including “forget instance” and partition ring state changes)
- Explore **data objects** and view file metadata via a built-in explorer
- Manage and review **delete requests**
- Analyze tenant label distribution (cardinality / stream coverage)
- Compare “Goldfish” sampled query results side-by-side

## Requirements

- **Grafana**: \(>= 10.4.0\)
- **Permissions**: the plugin UI is restricted to **Org Admins** (non-admin users see an Unauthorized error)
- **Datasource**: at least one **Loki datasource** configured with **proxy** access (the plugin lets you pick the datasource in the UI)
- **Loki / operational endpoints**: the plugin calls operational APIs via Grafana’s datasource proxy under a `/ui/` prefix (for example: `/ui/api/v1/cluster/nodes`, `/ui/api/v1/goldfish/queries`, `/ui/api/v1/tenants/<tenant>/analyze-labels`)

## Getting started

1. Install the plugin in Grafana and enable it.
2. Configure (or provision) at least one Loki datasource.
3. Navigate to the app: **More apps → Loki Operational UI**.
4. Select the Loki datasource you want to operate against (top right datasource picker).

## What it does (by area)

- **Cluster → Nodes**
  - Lists cluster members and their services, status, version/build metadata, and quick filtering/sorting.
- **Rings**
  - Discovers available rings from the cluster’s advertised services and shows the relevant ring UI.
  - Supports ring inspection plus operational actions (for example, forgetting selected instances where supported).
- **Storage → Data Objects**
  - File-style explorer for data objects, including download links and metadata inspection.
- **Tenants → Deletes**
  - Lists delete requests and provides a “new delete request” workflow.
- **Tenants → Analyze Labels**
  - Runs label distribution analysis for a tenant over a selectable time range.
- **Goldfish**
  - Browses sampled queries with filters (tenant/user/outcome/time range) and compares results between Cell A and Cell B.

## Documentation

- Grafana Loki documentation: `https://grafana.com/docs/loki/latest/`
- Grafana plugin development docs: `https://grafana.com/developers/plugin-tools/`

## Contributing

- File bugs and feature requests with clear reproduction steps, expected behavior, and screenshots where possible.
- PRs are welcome; keep changes focused and include tests where practical.

## License

Apache-2.0
