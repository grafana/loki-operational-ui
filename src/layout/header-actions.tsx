import React from 'react';
import { GitHubLink } from './github-link';

export function HeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <GitHubLink />
    </div>
  );
}
