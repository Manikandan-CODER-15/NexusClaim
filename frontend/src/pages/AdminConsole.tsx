import React, { useEffect, useState } from 'react';
import { 
  Users, Clock, RefreshCw, Lock 
} from 'lucide-react';
import { api, auth } from '../api';

interface UserRecord {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface AuditRecord {
  id: string;
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  created_at: string;
}

const AdminConsole: React.FC = () => {
  const user = auth.getUser();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [loading, setLoading] = useState(false);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [u, a] = await Promise.all([
        api.get<UserRecord[]>('/api/admin/users'),
        api.get<AuditRecord[]>('/api/admin/audit-logs')
      ]);
      setUsers(u || []);
      setAuditLogs(a || []);
    } catch {
      // Fallback display if mock
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  if (user?.role !== 'admin') {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <Lock size={36} className="mx-auto text-rose-500 mb-2" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Access Denied</h3>
        <p className="text-xs text-slate-500 mt-1">
          The Admin Console is strictly restricted to authorized Admin accounts per Section 7 RBAC matrix.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Admin Console</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based access control, cryptographic audit trail oversight & policy catalog administration
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="p-2 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 self-start sm:self-auto"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-1 border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users size={15} />
          <span>Users & Roles ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-1 border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'audit'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock size={15} />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab: Users */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                      {u.full_name}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        Active
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {u.created_at ? u.created_at.slice(0, 10) : '2026-10-31'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3.5">Action Code</th>
                  <th className="px-5 py-3.5">Entity Type</th>
                  <th className="px-5 py-3.5">Entity ID</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors font-mono text-xs">
                    <td className="px-5 py-3.5 font-bold text-indigo-600 dark:text-indigo-400">
                      {log.action}
                    </td>
                    <td className="px-5 py-3.5 uppercase">{log.entity_type || 'SYSTEM'}</td>
                    <td className="px-5 py-3.5 text-slate-400">{log.entity_id ? log.entity_id.slice(0, 8) + '...' : '-'}</td>
                    <td className="px-5 py-3.5 text-slate-400">{log.created_at ? log.created_at.slice(0, 19).replace('T', ' ') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsole;
