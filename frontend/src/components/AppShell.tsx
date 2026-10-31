import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LucideIcons } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';

const menuItems = [
  { to: '/dashboard', key: 'dashboard' },
  { to: '/claims', key: 'claims' },
  { to: '/evidence', key: 'evidence' },
  { to: '/findings', key: 'findings' },
  { to: '/graph', key: 'graph' },
  { to: '/review', key: 'review' },
  { to: '/admin', key: 'admin' },
  { to: '/settings', key: 'settings' },
  { to: '/reports', key: 'reports' },
];

const AppShell: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-canvas text-primary">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-primary p-4 overflow-y-auto hidden md:block">
        <div className="flex items-center mb-6">
          <span className="text-2xl font-bold">NexusClaim</span>
        </div>
        <nav>
          {menuItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  isActive ? 'bg-primary text-white' : ''
                }`
              }
            >
              {/* simple circle icon placeholder */}
              <span className="w-2 h-2 bg-primary-dark rounded mr-2"></span>
              {t(`menu.${item.key}`)}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between p-4 border-b border-primary bg-card">
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <span className="text-xl font-semibold">NexusClaim</span>
            {/* How to use button */}
            <button
              className="flex items-center space-x-1 text-sm text-primary hover:underline"
              onClick={() => {
                // open modal via custom event – placeholder for now
                const ev = new CustomEvent('open-howto');
                window.dispatchEvent(ev);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M12 4v16" />
                <path d="M12 4H3" />
                <path d="M12 4l8 8-8 8" />
              </svg>
              <span>{t('howToUse.title')}</span>
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;

