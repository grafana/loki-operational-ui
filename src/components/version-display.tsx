import React, { useState } from 'react';
import { useVersionInfo } from 'hooks/use-version-info';
import { Loader2 } from 'lucide-react';
import { CopyButton } from 'components/common/copy-button';

export function VersionDisplay() {
  const { mostCommonVersion, versionInfos, isLoading } = useVersionInfo();
  const [isOpen, setIsOpen] = useState(false);

  const getVersionText = () => {
    return versionInfos
      .map(
        ({ version, info }) => `Version: ${version}
Revision: ${info.revision}
Branch: ${info.branch}
Build User: ${info.buildUser}
Build Date: ${info.buildDate}
Go Version: ${info.goVersion}
`
      )
      .join('\n');
  };

  return (
    <div className="relative">
      <span className="text-sm text-muted-foreground flex items-center gap-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`transition-opacity duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-1 -mx-1 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {mostCommonVersion}
        </button>
        {isLoading && (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading...
          </>
        )}
      </span>
      {isOpen && (
        <div className="absolute z-50 bottom-full mb-2 left-0 w-[400px] border rounded bg-white shadow-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Build Information</div>
            {!isLoading && versionInfos.length > 0 && <CopyButton text={getVersionText()} />}
          </div>
          <div>
            {versionInfos.length > 0 ? (
              versionInfos.map(({ version, info }) => (
                <div key={version} className="mb-2 last:mb-0">
                  <div className="font-semibold">{version}</div>
                  <div className="text-sm">
                    <div>Revision: {info.revision}</div>
                    <div>Branch: {info.branch}</div>
                    <div>Build User: {info.buildUser}</div>
                    <div>Build Date: {info.buildDate}</div>
                    <div>Go Version: {info.goVersion}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No build information available</div>
            )}
          </div>
          {isLoading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading build information...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
