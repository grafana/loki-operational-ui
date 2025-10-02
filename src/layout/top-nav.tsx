import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { prefixRoute } from 'utils/utils.routing';
import { useStyles2 } from '@grafana/ui';
import { DropdownMenu } from 'components/ui/dropdown-menu';
import { useCluster } from '../contexts/use-cluster';
import { getAvailableRings } from 'lib/ring-utils';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

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

const getStyles = (theme: GrafanaTheme2) => ({
  nav: css({
    backgroundColor: theme.colors.background.primary,
    borderBottom: `1px solid ${theme.colors.border.weak}`,
  }),
  navContainer: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
  }),
  navItems: css({
    display: 'flex',
    alignItems: 'center',
    gap: 24,
  }),
  navLink: css({
    padding: '8px 12px',
    borderRadius: theme.shape.radius.default,
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s',
    textDecoration: 'none',
    color: theme.colors.text.primary,
    '&:hover': {
      backgroundColor: theme.colors.action.hover,
      color: theme.colors.text.primary,
      textDecoration: 'none',
    },
  }),
  activeNavLink: css({
    backgroundColor: theme.colors.action.selected,
    color: theme.colors.text.primary,
  }),
  dropdownButton: css({
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '8px 12px',
    borderRadius: theme.shape.radius.default,
    fontSize: 14,
    fontWeight: 500,
    border: 'none',
    backgroundColor: 'transparent',
    color: theme.colors.text.primary,
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: theme.colors.action.hover,
    },
  }),
  activeDropdownButton: css({
    backgroundColor: theme.colors.action.selected,
  }),
  chevron: css({
    height: 16,
    width: 16,
  }),
});

export function TopNav({ className }: TopNavProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const { cluster } = useCluster();
  const navItems = useNavItems(cluster, baseNavItems);
  const styles = useStyles2(getStyles);

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
      className={`${styles.navLink} ${isActive(item.url) ? styles.activeNavLink : ''} ${linkClassName || ''}`}
    >
      {item.title}
    </Link>
  );

  return (
    <nav className={`${styles.nav} ${className || ''}`}>
      <div className={styles.navContainer}>
        {/* All Navigation Items */}
        <div className={styles.navItems}>
          {navItems.map((item) => (
            <div key={item.title}>
              {item.items && item.items.length > 0 ? (
                <DropdownMenu
                  items={item.items.map((subItem) => ({
                    label: subItem.title,
                    onClick: () => {
                      window.location.href = prefixRoute(subItem.url);
                    },
                  }))}
                >
                  <button
                    className={`${styles.dropdownButton} ${isActive(item.url) ? styles.activeDropdownButton : ''}`}
                  >
                    {item.title}
                    <ChevronDown className={styles.chevron} />
                  </button>
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
