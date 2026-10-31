import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, AlertTriangle, Clock, 
  ArrowRight, ShieldAlert, Sparkles, RefreshCw 
} from 'lucide-react';
import { api, auth } from '../api';
import type { Claim } from '../api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = auth.getUser();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Admin sees system overview only; skip claims fetch
      if (user?.role === 'admin') {
        setClaims([]);
        setLoading(false);
        return;
      }
      const claimsData = await api.get<Claim[]>('/api/claims', { limit: 10 });
      setClaims(claimsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalClaims = claims.length;
  const inInvestigation = claims.filter(c => c.status === 'investigating').length;
  const pendingReview = claims.filter(c => c.status === 'pending_review').length;
  const highPriority = claims.filter(c => c.priority === 'high' || c.priority === 'urgent').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-medium mb-3">
            <Sparkles size={14} className="text-yellow-300" />
            <span>Autonomous Claims Intelligence Engine Active</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.full_name || 'Investigator'}</h1>
          <p className="text-indigo-100 text-sm mt-1">
            Logged in as <span className="font-semibold uppercase tracking-wide px-2 py-0.5 bg-black/20 rounded">{user?.role}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition text-white"
            title="Refresh dashboard"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => navigate('/claims')}
            className="px-4 py-2.5 bg-white text-indigo-700 font-semibold text-sm rounded-xl shadow hover:bg-indigo-50 transition flex items-center space-x-2"
          >
            <span>View All Claims</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Claims</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalClaims}</div>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <FileText size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Investigating</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{inInvestigation}</div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Review</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{pendingReview}</div>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">High Priority / Urgent</div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{highPriority}</div>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
            <ShieldAlert size={24} />
          </div>
        </div>
      </div>

      {/* Claims Quick Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Active Claims Overview</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Click any claim to open the 6-agent inspection center</p>
          </div>
          <button
            onClick={() => navigate('/claims')}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
          >
            <span>See all claims</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-5 py-3.5">Claim ID</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Est. Amount</th>
                <th className="px-5 py-3.5">Evidence</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
              {claims.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    {loading ? 'Loading claims from backend...' : 'No claims found for this account.'}
                  </td>
                </tr>
              ) : (
                claims.map((c) => (
                  <tr 
                    key={c.id} 
                    onClick={() => navigate(`/claims/${c.id}`)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-medium text-indigo-600 dark:text-indigo-400">
                      {c.claim_number}
                    </td>
                    <td className="px-5 py-3.5 capitalize">{c.category}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        c.priority === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' :
                        c.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                        c.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                        c.status === 'investigating' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium">
                      ${Number(c.estimated_amount || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center space-x-1 text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        <span>{c.evidence_count ?? 0} files</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline inline-flex items-center space-x-1">
                        <span>Inspect</span>
                        <ArrowRight size={13} />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
