import React from 'react';
import useBreadcrumbs from 'use-react-router-breadcrumbs';
import { Link } from 'react-router-dom';
// Breadcrumb components replaced with custom implementation
import { routes } from 'config/routes';
import { prefixRoute } from 'utils/utils.routing';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from 'components/ui/breadcrumb';

export function BreadcrumbNav() {
  const breadcrumbs = useBreadcrumbs(routes, {
    disableDefaults: true,
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map(({ match, breadcrumb }, index) => (
          <React.Fragment key={match.pathname}>
            <BreadcrumbItem className={index === 0 ? 'hidden md:block' : ''}>
              {index === breadcrumbs.length - 1 ? (
                <BreadcrumbPage>{breadcrumb}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={prefixRoute(match.pathname.replace(/^\//, ''))}>{breadcrumb}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator className={index === 0 ? 'hidden md:block' : ''} />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
