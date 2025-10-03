/**
 * Extracts the basename from the current URL by matching everything up to and including /ui/
 * @returns The basename string, defaults to "/ui/" if no match is found
 */
export function getBasename(): string {
  const pathname = window.location.pathname;
  const match = pathname.match(/(.*\/ui\/)/);
  return match?.[1] || '/ui/';
}

export function absolutePath(path: string, datasourceUid: string): string {
  const basename = getBasename();
  const apiPath = `${basename}${path.startsWith('/') ? path.slice(1) : path}`;

  // Remove leading slash from apiPath to avoid double slashes in final URL
  const cleanApiPath = apiPath.startsWith('/') ? apiPath.slice(1) : apiPath;
  return `/api/datasources/proxy/uid/${datasourceUid}/${cleanApiPath}`;
}
