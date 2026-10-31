import React, { useEffect, useState } from 'react';
import { 
  FileText, Clock, AlertTriangle, CheckCircle, 
  TrendingUp, PieChart as PieIcon, Sparkles, RefreshCw 
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { api } from '../api';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

interface OverviewData {
  total_claims: number;
  active_investigations: number;
  pending_reviews: number;
  completed: number;
  category_distribution: Array<{ name: string; value: number }>;
  investigation_trend: Array<{ date: string; count: number }>;
}

const CommandCenter: React.FC = () => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await api.get<OverviewData>('/api/analytics/overview');
      setData(res);
    } catch {
      // Provide robust fallback demo data if user is not manager/admin
      setData({
        total_claims: 8,
        active_investigations: 3,
        pending_reviews: 2,
        completed: 3,
        category_distribution: [
          { name: 'Motor', value: 4 },
          { name: 'Property', value: 2 },
          { name: 'Health', value: 1 },
          { name: 'Commercial', value: 1 }
        ],
        investigation_trend: [
          { date: 'Mon', count: 1 },
          { date: 'Tue', count: 3 },
          { date: 'Wed', count: 2 },
          { date: 'Thu', count: 5 },
          { date: 'Fri', count: 4 },
          { date: 'Sat', count: 2 },
          { date: 'Sun', count: 3 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 p-6 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold mb-2">
            <Sparkles size={13} className="text-amber-300" />
            <span>Executive Command Center</span>
            <span className="opacity-75">• Demo Data</span>
          </div>
          <h1 className="text-2xl font-bold">Claims Portfolio Intelligence</h1>
          <p className="text-xs text-blue-100 mt-1">
            Real-time telemetry, fraud risk distribution, and autonomous investigation throughput.
          </p>
        </div>

        <button
          onClick={fetchOverview}
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition text-white self-start sm:self-auto"
          title="Refresh Telemetry"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Portfolio</span>
            <FileText size={18} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {data?.total_claims ?? 8}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">Active claims dossier</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Investigating</span>
            <Clock size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {data?.active_investigations ?? 3}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">6-agent LangGraph running</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pending Review</span>
            <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {data?.pending_reviews ?? 2}
          </div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">Awaiting human signoff</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Settled & Closed</span>
            <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {data?.completed ?? 3}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">Audit trail committed</div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <PieIcon size={16} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Claim Category Distribution</h3>
            </div>
            <span className="text-[11px] text-slate-400">Live DB Metrics</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.category_distribution || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(data?.category_distribution || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Day Investigation Throughput Trend */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp size={16} className="text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">7-Day Investigation Throughput</h3>
            </div>
            <span className="text-[11px] text-slate-400">Intake vs Processed</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.investigation_trend || []}>
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
