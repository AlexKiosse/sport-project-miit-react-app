import React from 'react';
import { CabinetHeader } from '/widgets/cabinet-header';
import { AppFooter } from '/widgets/app-footer';

/**
 * @param {{
 *   pageClassName?: string,
 *   sidebarClassName?: string,
 *   mainClassName?: string,
 *   badge?: string,
 *   badgeClassName?: string,
 *   rightContent?: React.ReactNode,
 *   sidebar: React.ReactNode,
 *   children: React.ReactNode,
 *   footerShowLinks?: boolean,
 *   footerLinks?: Array<{ href: string, label: string }>,
 * }} props
 */
export const CabinetLayout = ({
  pageClassName = '',
  sidebarClassName = '',
  mainClassName = '',
  badge,
  badgeClassName = '',
  rightContent,
  sidebar,
  children,
  footerShowLinks = true,
  footerLinks,
}) => {
  const pageClasses = ['cabinet-page', 'admin-page', pageClassName].filter(Boolean).join(' ');
  const sidebarClasses = ['admin-sidebar', sidebarClassName].filter(Boolean).join(' ');
  const mainClasses = ['admin-main', mainClassName].filter(Boolean).join(' ');

  return (
    <div className={pageClasses}>
      <CabinetHeader badge={badge} badgeClassName={badgeClassName} rightContent={rightContent} />
      <div className="admin-container">
        <aside className={sidebarClasses}>{sidebar}</aside>
        <main className={mainClasses}>{children}</main>
      </div>
      <AppFooter links={footerLinks} showLinks={footerShowLinks} />
    </div>
  );
};
