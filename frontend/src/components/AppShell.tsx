import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, GitFork, LogOut, 
  Upload, Cpu, Layers, Zap, FileCheck, Printer, 
  Users, HelpCircle, X, ChevronRight, ChevronLeft 
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import { auth } from '../api';

const guideSteps = [
  { step: 1, title: 'Sign in using a demo role', desc: 'Choose Manager, Investigator, Fraud & Risk, Admin, or End User for role-specific authorizations.' },
  { step: 2, title: 'Open an existing claim or create a new one', desc: 'Browse the claims catalog, review metadata, or submit a new incident.' },
  { step: 3, title: 'Upload multimodal evidence', desc: 'Attach photos, written statements, repair invoices with SHA-256 integrity verification.' },
  { step: 4, title: 'Run the 6-agent AI investigation', desc: 'Watch Document, Vision, Policy, Anomaly, Reasoning, and Investigation agents synchronize.' },
  { step: 5, title: 'Explore the evidence reasoning graph', desc: 'Inspect cross-modal contradiction nodes, verified links, and hypothesis probabilities.' },
  { step: 6, title: 'Inject new evidence for adaptive re-evaluation', desc: 'Simulate secondary photographic evidence to observe localized graph updates without false fraud flags.' },
  { step: 7, title: 'Review findings and record a human decision', desc: 'Verify deterministic math formulas and commit auditable decisions.' },
  { step: 8, title: 'Generate and download the investigation report', desc: 'Export an enterprise PDF complete with executive summary and audit history.' }
];

const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const user = auth.getUser();
  const role = user?.role || 'end_user';

  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(0);

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  // Role-based menu generation per Section 7 Permission Matrix
  const getMenuItems = () => {
    if (role === 'admin') {
      return [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin', label: 'Admin Console', icon: Users },
      ];
    }
    if (role === 'end_user') {
      return [
        { to: '/claims', label: 'My Claims', icon: FileText },
        { to: '/evidence', label: 'Upload Evidence', icon: Upload },
      ];
    }
    if (role === 'manager') {
      return [
        { to: '/command-center', label: 'Command Center', icon: LayoutDashboard },
        { to: '/claims', label: 'Claims Portfolio', icon: FileText },
        { to: '/agents', label: 'AI Agent Center', icon: Cpu },
        { to: '/graph', label: 'Evidence Graph', icon: GitFork },
        { to: '/review', label: 'Review & Decision', icon: FileCheck },
        { to: '/reports', label: 'Reports & Export', icon: Printer },
      ];
    }
    if (role === 'fraud_risk') {
      return [
        { to: '/command-center', label: 'Risk Dashboard', icon: LayoutDashboard },
        { to: '/claims', label: 'Flagged Claims', icon: FileText },
        { to: '/graph', label: 'Evidence Graph', icon: GitFork },
        { to: '/simulator', label: 'Adaptive Simulator', icon: Zap },
        { to: '/reports', label: 'Reports', icon: Printer },
      ];
    }
    // Default: Investigator
    return [
      { to: '/claims', label: 'Assigned Claims', icon: FileText },
      { to: '/evidence', label: 'Evidence Intake', icon: Upload },
      { to: '/studio', label: 'Evidence Studio', icon: Layers },
      { to: '/agents', label: 'Agent Center', icon: Cpu },
      { to: '/graph', label: 'Evidence Graph', icon: GitFork },
      { to: '/simulator', label: 'Simulator', icon: Zap },
      { to: '/review', label: 'Review Center', icon: FileCheck },
      { to: '/reports', label: 'Reports', icon: Printer },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 antialiased font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
              N
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                NexusClaim
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-1">
                Claims Intelligence
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                    }`
                  }
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Badge & Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {user?.full_name || user?.email || 'User'}
              </div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide truncate">
                {user?.role || 'Guest'}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              NexusClaim Live • 127.0.0.1:8000
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Guide Help Button */}
            <button
              onClick={() => {
                setGuideStep(0);
                setShowGuide(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
              title="Interactive Platform Guide"
            >
              <HelpCircle size={15} className="text-indigo-600" />
              <span>How To Use</span>
            </button>

            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* 8-Step Interactive Stepper Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-bold text-xs">
                  Step {guideStep + 1} / 8
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Platform Walkthrough Guide
                </h3>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-2">
              <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {guideSteps[guideStep].title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {guideSteps[guideStep].desc}
              </p>
            </div>

            {/* Step Dots Indicator */}
            <div className="flex justify-center space-x-1.5 py-2">
              {guideSteps.map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === guideStep ? 'w-5 bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                disabled={guideStep === 0}
                onClick={() => setGuideStep(s => Math.max(0, s - 1))}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold disabled:opacity-40 flex items-center space-x-1"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              {guideStep < 7 ? (
                <button
                  onClick={() => setGuideStep(s => Math.min(7, s + 1))}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow flex items-center space-x-1"
                >
                  <span>Next Step</span>
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => setShowGuide(false)}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow"
                >
                  Start Demo
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppShell;
