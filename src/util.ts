/**
 * Extracts the basename from the current URL by matching everything up to and including /ui/
 * @returns The basename string, defaults to "/ui/" if no match is found
 */
export function getBasename(): string {
  const pathname = window.location.pathname;
  //TODO: can we get the pluing path/name from the Grafana context?
  const match = pathname.match(/(.*\/)a\/grafana-lokioperational-app/);
  return match?.[1] || '/';
}

