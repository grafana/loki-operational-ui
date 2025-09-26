// import {
//   NodeBreadcrumb,
//   RingBreadcrumb,
// } from "components/shared/route-breadcrumbs";
import { NotFound } from "components/shared/errors/not-found";
import Ring from "pages/ring";
import React from 'react';
import { RouteObject } from "react-router-dom";
import { DataObjectsPage } from "pages/data-objects";
import { FileMetadataPage } from "pages/file-metadata";
import Nodes from "pages/nodes";
import NodeDetails from "pages/node-details";
import ComingSoon from "pages/coming-soon";
import DeletesPage from "pages/deletes";
import NewDeleteRequest from "pages/new-delete";
import AnalyzeLabels from "pages/analyze-labels";
import GoldfishPage from "pages/goldfish";

// type RouteObjectWithBreadcrumb = Omit<RouteObject, "children"> & {
//   breadcrumb: string | BreadcrumbComponentType;
// };

// Routes configuration for breadcrumbs
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Nodes />
  },
  {
    path: "/nodes",
    element: <Nodes />,
  },
  {
    path: "/nodes/:nodeName",
    element: <NodeDetails />,
  },
  {
    path: "/versions",
    element: <ComingSoon />,
  },
  {
    path: "/rings",
    element: <Ring />,
  },
  {
    path: "/rings/:ringName",
    element: <Ring />,
  },
  {
    path: "/storage",
    element: <ComingSoon />,
  },
  {
    path: "/storage/object",
    element: <ComingSoon />,
  },
  {
    path: "/storage/dataobj",
    element: <DataObjectsPage />,
  },
  {
    path: "/storage/dataobj/metadata",
    element: <FileMetadataPage />,
  },
  {
    path: "/tenants",
    element: <ComingSoon />,
  },
  {
    path: "/tenants/deletes",
    element: <DeletesPage />,
  },
  {
    path: "/tenants/deletes/new",
    element: <NewDeleteRequest />,
  },
  {
    path: "/tenants/analyze-labels",
    element: <AnalyzeLabels />,
  },
  {
    path: "/tenants/limits",
    element: <ComingSoon />,
  },
  {
    path: "/tenants/labels",
    element: <ComingSoon />,
  },
  {
    path: "/rules",
    element: <ComingSoon />,
  },
  {
    path: "/goldfish",
    element: <GoldfishPage />,
  },
  {
    path: "/404",
    element: <NotFound />,
  },
];
