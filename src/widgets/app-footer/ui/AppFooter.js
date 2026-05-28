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
      <div className="footer-logo">Все на спорт</div>
      <p>© 2026 РУТ МИИТ</p>
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
