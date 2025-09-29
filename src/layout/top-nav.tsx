import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { prefixRoute } from 'utils/utils.routing';
import { Button } from 'components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'components/ui/dropdown-menu';
import { cn } from 'lib/utils';
import { useCluster } from '../contexts/use-cluster';
import { getAvailableRings } from 'lib/ring-utils';

interface NavItem {
  title: string;
  url: string;
  icon?: React.ReactNode;
  items?: Array<{ title: string; url: string }>;
  noPrefix?: boolean;
}

const baseNavItems: NavItem[] = [
  {
    title: 'Cluster',
    url: 'nodes',
    items: [
      { title: 'Nodes', url: 'nodes' },
      { title: 'Rollouts & Versions', url: 'versions' },
    ],
  },
  {
    title: 'Rings',
    url: 'rings',
    items: [], // Will be populated dynamically
  },
  {
    title: 'Goldfish',
    url: 'goldfish',
  },
  {
    title: 'Storage',
    url: 'storage',
    items: [
      { title: 'Object Storage', url: 'storage/object' },
      { title: 'Data Objects', url: 'storage/dataobj' },
    ],
  },
  {
    title: 'Tenants',
    url: 'tenants',
    items: [
      { title: 'Analyze Labels', url: 'tenants/analyze-labels' },
      { title: 'Deletes', url: 'tenants/deletes' },
      { title: 'Limits', url: 'tenants/limits' },
      { title: 'Labels', url: 'tenants/labels' },
    ],
  },
  {
    title: 'Rules',
    url: 'rules',
  },
  {
    title: 'Documentation',
    url: 'https://grafana.com/docs/loki/latest/',
    noPrefix: true,
  },
];

function useNavItems(cluster: any, baseItems: NavItem[]): NavItem[] {
  const [navItems, setNavItems] = React.useState<NavItem[]>(baseItems);

  React.useEffect(() => {
    if (!cluster?.members) {
      return;
    }

    // Update nav items based on available services
    const newItems = baseItems.map((item) => {
      if (item.title === 'Rings' && cluster.members) {
        return {
          ...item,
          items: getAvailableRings(cluster.members),
        };
      }
      return item;
    });

    setNavItems(newItems);
  }, [cluster?.members, baseItems]);

  return navItems;
}

interface TopNavProps {
  className?: string;
}

export function TopNav({ className }: TopNavProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const { cluster } = useCluster();
  const navItems = useNavItems(cluster, baseNavItems);

  const isActive = (url: string) => {
    if (url === '/') {
      return currentPath === '/';
    }
    return currentPath.includes(url);
  };

  const NavLink = ({ item, className: linkClassName }: { item: NavItem; className?: string }) => (
    <Link
      to={item.noPrefix ? item.url : prefixRoute(item.url)}
      target={item.url.includes('http') ? '_blank' : '_self'}
      className={cn(
        'px-3 py-2 rounded-md text-sm font-medium transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        isActive(item.url) && 'bg-accent text-accent-foreground',
        linkClassName
      )}
    >
      {item.title}
    </Link>
  );

  return (
    <nav className={cn('bg-card border-b border-border', className)}>
      <div className="flex items-center justify-between px-6 py-4">
        {/* All Navigation Items */}
        <div className="flex items-center gap-6">
          {navItems.map((item) => (
            <div key={item.title}>
              {item.items && item.items.length > 0 ? (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn('gap-1', isActive(item.url) && 'bg-accent text-accent-foreground')}
                    >
                      {item.title}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-56"
                    sideOffset={8}
                    avoidCollisions={true}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                    style={{
                      position: 'fixed',
                      zIndex: 50,
                    }}
                  >
                    {item.items.map((subItem) => (
                      <DropdownMenuItem key={subItem.title} asChild>
                        <Link
                          to={prefixRoute(subItem.url)}
                          className={cn('w-full', isActive(subItem.url) && 'bg-accent text-accent-foreground')}
                        >
                          {subItem.title}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <NavLink item={item} />
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
