import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, UserCheck, KeyRound, AlertCircle, ArrowRight, 
  HelpCircle, X, ChevronLeft, ChevronRight 
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { api, auth } from '../api';

const demoUsers = [
  { label: 'Manager (Approver)', email: 'manager@nexusclaim.demo', pass: 'Manager@123', role: 'manager', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700' },
  { label: 'Investigator', email: 'investigator@nexusclaim.demo', pass: 'Invest@123', role: 'investigator', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700' },
  { label: 'Fraud & Risk Analyst', email: 'risk@nexusclaim.demo', pass: 'Risk@123', role: 'fraud_risk', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700' },
  { label: 'Admin', email: 'admin@nexusclaim.demo', pass: 'Admin@123', role: 'admin', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700' },
  { label: 'End User (Claimant)', email: 'enduser@nexusclaim.demo', pass: 'User@123', role: 'end_user', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' },
];

const guideSteps = [
  { step: 1, title: '1. Sign in using a demo role', desc: 'Choose Manager, Investigator, Fraud & Risk, Admin, or End User for role-specific authorizations.' },
  { step: 2, title: '2. Open an existing claim or create a new one', desc: 'Browse the claims catalog, review metadata, or submit a new incident.' },
  { step: 3, title: '3. Upload multimodal evidence', desc: 'Attach photos, written statements, repair invoices with SHA-256 integrity verification.' },
  { step: 4, title: '4. Run the 6-agent AI investigation', desc: 'Watch Document, Vision, Policy, Anomaly, Reasoning, and Investigation agents synchronize.' },
  { step: 5, title: '5. Explore the evidence reasoning graph', desc: 'Inspect cross-modal contradiction nodes, verified links, and hypothesis probabilities.' },
  { step: 6, title: '6. Inject new evidence for adaptive re-evaluation', desc: 'Simulate secondary photographic evidence to observe localized graph updates without false fraud flags.' },
  { step: 7, title: '7. Review findings and record a human decision', desc: 'Verify deterministic math formulas and commit auditable decisions.' },
  { step: 8, title: '8. Generate and download the investigation report', desc: 'Export an enterprise PDF complete with executive summary and audit history.' }
];

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('manager@nexusclaim.demo');
  const [password, setPassword] = useState('Manager@123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(0);

  const handleSubmit = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    try {
      const data: any = await api.post('/api/auth/login', {
        email: loginEmail,
        password: loginPass,
        remember_me: true,
      });

      auth.setAuth(data.access_token, {
        id: data.user_id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
      });

      // Role-based redirect
      if (data.role === 'admin') navigate('/admin');
      else if (data.role === 'end_user') navigate('/claims');
      else if (data.role === 'manager') navigate('/command-center');
      else navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (uEmail: string, uPass: string) => {
    setEmail(uEmail);
    setPassword(uPass);
    handleSubmit(undefined, uEmail, uPass);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between">
      {/* Login Top Bar per Section 4.3 */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base">
            N
          </div>
          <span className="font-bold text-white text-base tracking-tight">NexusClaim</span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setGuideStep(0);
              setShowGuide(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            <HelpCircle size={15} className="text-indigo-400" />
            <span>How to use</span>
          </button>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Login Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden grid md:grid-cols-5">
          {/* Left Brand Area */}
          <div className="md:col-span-2 bg-gradient-to-br from-indigo-700 to-blue-800 p-8 text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center font-bold text-xl">
                  N
                </div>
                <h1 className="text-2xl font-bold tracking-tight">NexusClaim</h1>
              </div>
              <p className="text-indigo-100 text-xs leading-relaxed mb-6">
                Autonomous Multimodal Claims Intelligence Platform with LangGraph 6-Agent Orchestration, Cross-Evidence Reasoning, and Human-in-the-Loop Audit Trails.
              </p>
              <div className="space-y-2.5 text-xs text-indigo-100">
                <div className="flex items-center space-x-2">
                  <ShieldCheck size={16} className="text-emerald-300" />
                  <span>Multimodal Vision & Document Extraction</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck size={16} className="text-emerald-300" />
                  <span>Evidence Reasoning Knowledge Graph</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck size={16} className="text-emerald-300" />
                  <span>Adaptive Simulator & Re-evaluation</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-indigo-500/40 text-[11px] text-indigo-200">
              Demo Environment • Synthetic Data
            </div>
          </div>

          {/* Right Form & 1-Click Roles */}
          <div className="md:col-span-3 p-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Select Demo Persona</h2>
            <p className="text-xs text-slate-500 mb-4">
              Click any role to test authorization matrix and role-tailored workspaces:
            </p>

            {/* Quick Demo Role Cards */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {demoUsers.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => handleQuickLogin(user.email, user.pass)}
                  className={`text-left p-2.5 rounded-xl border text-xs font-semibold transition hover:scale-[1.02] flex items-center justify-between ${user.color}`}
                >
                  <div>
                    <div>{user.label}</div>
                    <div className="text-[10px] opacity-75 font-normal">{user.email}</div>
                  </div>
                  <ArrowRight size={13} className="opacity-60" />
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-2.5 text-slate-400" size={15} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 text-slate-400" size={15} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition shadow disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                <span>{loading ? 'Authenticating Persona...' : 'Sign In'}</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-3 text-[11px] text-slate-500">
        NexusClaim Autonomous Multimodal Insurance Intelligence Platform v1.0.0
      </footer>

      {/* How to use modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-bold text-xs">
                Step {guideStep + 1} / 8
              </span>
              <button onClick={() => setShowGuide(false)} className="p-1 text-slate-400 hover:text-slate-600">
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
                  Close & Explore
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
