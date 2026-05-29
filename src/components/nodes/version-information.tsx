import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from 'components/ui/card';
import { Label } from 'components/ui/label';
import { Badge } from 'components/ui/badge';
import appleIcon from './icons/apple.svg';
import linuxIcon from './icons/linux.svg';
import windowsIcon from './icons/windows.svg';

interface VersionInformationProps {
  build: {
    version: string;
    branch?: string;
    goVersion: string;
  };
  edition: string;
  os: string;
  arch: string;
}

const getOSIcon = (os: string) => {
  const osLower = os.toLowerCase();
  if (osLower.includes('darwin') || osLower.includes('mac')) {
    return <img src={appleIcon} alt="macOS" className="h-4 w-4 dark:invert" />;
  }
  if (osLower.includes('linux')) {
    return <img src={linuxIcon} alt="Linux" className="h-4 w-4 dark:invert" />;
  }
  if (osLower.includes('windows')) {
    return <img src={windowsIcon} alt="Windows" className="h-4 w-4 dark:invert" />;
  }
  return null;
};

const getEditionBadgeStyle = (edition: string): string => {
  const editionLower = edition.toLowerCase();

  if (editionLower === 'oss') {
    return 'bg-blue-500/20 text-blue-700 dark:bg-blue-500/30 dark:text-blue-300 hover:bg-blue-500/30';
  }
  if (editionLower === 'enterprise') {
    return 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/30 dark:text-yellow-300 hover:bg-yellow-500/30';
  }
  return ''; // default badge style
};

export function VersionInformation({ build, edition, os, arch }: VersionInformationProps) {
  const osIcon = getOSIcon(os);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Version Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="space-y-2">
              <Label>Version</Label>
              <p className="text-sm">{build.version}</p>
            </div>
            <div className="space-y-2">
              <Label>Branch</Label>
              <p className="text-sm">{build.branch}</p>
            </div>
            <div className="space-y-2">
              <Label>Go Version</Label>
              <p className="text-sm">{build.goVersion}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="space-y-2">
              <Label>Edition</Label>
              <div>
                <Badge className={getEditionBadgeStyle(edition)}>{edition.toUpperCase()}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Architecture</Label>
              <p className="text-sm">{arch}</p>
            </div>
            <div className="space-y-2">
              <Label>OS</Label>
              <div className="flex items-center gap-2">
                {osIcon}
                <p className="text-sm">{os}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
