import React from 'react';

const DEFAULT_LINKS = [
  { href: '#', label: 'Контакты' },
  { href: '#', label: 'О портале' },
  { href: '#', label: 'Политика конфиденциальности' },
];

/**
 * Футер кабинета (эталон — админ-панель).
 * @param {{ links?: Array<{ href: string, label: string }>, showLinks?: boolean }} props
 */
export const AppFooter = ({ links = DEFAULT_LINKS, showLinks = true }) => (
  <footer className="footer">
    <div className="footer-content">
      <div className="footer-logo">РУТ СПОРТ</div>
      <p>© 2024 РУТ (МИИТ) Спортивный отдел</p>
      {showLinks && links.length > 0 ? (
        <div className="footer-links">
          {links.map((link) => (
            <a key={link.label} href={link.href} onClick={(e) => e.preventDefault()}>
              {link.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  </footer>
);
