import React from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
// Table components replaced with native HTML table elements styled with useStyles2
import { FolderIcon, FileIcon, DownloadIcon } from 'lucide-react';
import { ExplorerFile } from 'types/explorer';
import { formatBytes } from 'lib/utils';
import { DateHover } from '../common/date-hover';
import { Button } from '@grafana/ui';
import { prefixRoute } from 'utils/utils.routing';

interface FileListProps {
  current: string;
  parent: string | null;
  files: ExplorerFile[];
  folders: string[];
}

export function FileList({ current, parent, files, folders }: FileListProps) {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  const handleNavigate = (path: string) => {
    setSearchParams({ path });
  };

  const handleFileClick = (file: ExplorerFile) => {
    navigate(prefixRoute(`storage/dataobj/metadata?path=${encodeURIComponent(current + '/' + file.name)}`));
  };

  return (
    <div className="space-y-4">
      <table className="w-full">
        <thead>
          <tr className="h-12">
            <th className="text-left">Name</th>
            <th className="text-left">Modified</th>
            <th className="text-left">Size</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {parent !== current && (
            <tr
              key="parent"
              className="h-12 cursor-pointer hover:bg-muted/50"
              onClick={() => handleNavigate(parent || '')}
            >
              <td className="font-medium">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  ..
                </div>
              </td>
              <td>-</td>
              <td>-</td>
              <td></td>
            </tr>
          )}
          {folders.map((folder) => (
            <tr
              key={folder}
              className="h-12 cursor-pointer hover:bg-muted/50"
              onClick={() => handleNavigate(current ? `${current}/${folder}` : folder)}
            >
              <td className="font-medium">
                <div className="flex items-center">
                  <FolderIcon className="mr-2 h-4 w-4" />
                  {folder}
                </div>
              </td>
              <td>-</td>
              <td>-</td>
              <td></td>
            </tr>
          ))}

          {files.map((file) => (
            <tr
              key={file.name}
              className="h-12 cursor-pointer hover:bg-muted/50"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('a[download]')) {
                  return;
                }
                handleFileClick(file);
              }}
            >
              <td className="font-medium">
                <div className="flex items-center">
                  <FileIcon className="mr-2 h-4 w-4" />
                  {file.name}
                </div>
              </td>
              <td>
                <DateHover date={new Date(file.lastModified)} />
              </td>
              <td>{formatBytes(file.size)}</td>
              <td>
                <Button variant="secondary" size="sm" onClick={(e) => e.stopPropagation()}>
                  <Link to={file.downloadUrl} target="_blank" download>
                    <DownloadIcon className="h-4 w-4" />
                  </Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
