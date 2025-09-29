import React from 'react';
import { TopNav } from './top-nav';
import { ScrollToTop } from '../components/ui/scroll-to-top';
import { Toaster } from 'components/ui/toaster';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="flex flex-1 flex-col">{children}</main>
      <Toaster />
      <ScrollToTop />
    </div>
  );
}
