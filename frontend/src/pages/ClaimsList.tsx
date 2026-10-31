import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, ArrowRight, GitFork, 
  PlusCircle, RefreshCw, AlertCircle 
} from 'lucide-react';
import { api, auth } from '../api';
import type { Claim } from '../api';

const ClaimsList: React.FC = () => {
  const navigate = useNavigate();
  const user = auth.getUser();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');

  // Submit Claim Modal (for end_user)
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState('auto');
  const [incidentDate, setIncidentDate] = useState('2026-10-25');
  const [description, setDescription] = useState('Rear bumper collision during parking.');
  const [estAmount, setEstAmount] = useState('4500');
  const [submitting, setSubmitting] = useState(false);

  const fetchClaims = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (statusFilter) params.status_filter = statusFilter;
      if (priorityFilter) params.priority_filter = priorityFilter;

      const data = await api.get<Claim[]>('/api/claims', params);
      setClaims(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [statusFilter, priorityFilter]);

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/claims', {
        policy_id: 'POL-DEMO-001',
        category,
        incident_date: new Date(incidentDate).toISOString(),
        description,
        priority: 'medium',
        estimated_amount: parseFloat(estAmount) || 0,
      });
      setShowModal(false);
      fetchClaims();
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClaims = claims.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.claim_number.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      (c.status && c.status.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Claims Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time view of multimodal insurance claims & investigation states
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {user?.role === 'end_user' && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow transition flex items-center space-x-1.5"
            >
              <PlusCircle size={15} />
              <span>Submit New Claim</span>
            </button>
          )}

          <button
            onClick={fetchClaims}
            className="p-2 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search claim # or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 text-xs">
            <Filter size={13} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs"
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="investigating">Investigating</option>
              <option value="pending_review">Pending Review</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center space-x-1.5 text-xs">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="py-1.5 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Showing {filteredClaims.length} records
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm rounded-xl border border-red-200 flex items-center space-x-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Claims Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-5 py-3.5">Claim Number</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Incident Date</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Est. Amount</th>
                <th className="px-5 py-3.5">Evidence Files</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    {loading ? 'Retrieving claims data...' : 'No claims match your filters or permissions.'}
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => (
                  <tr 
                    key={claim.id} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium text-indigo-600 dark:text-indigo-400 cursor-pointer" onClick={() => navigate(`/claims/${claim.id}`)}>
                      {claim.claim_number}
                    </td>
                    <td className="px-5 py-3.5 capitalize">{claim.category}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {claim.incident_date ? claim.incident_date.split('T')[0] : 'N/A'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        claim.priority === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' :
                        claim.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {claim.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                        claim.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                        claim.status === 'investigating' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium">
                      ${Number(claim.estimated_amount || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                        {claim.evidence_count ?? 0} files
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => navigate(`/graph/${claim.id}`)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        title="View Evidence Graph"
                      >
                        <GitFork size={15} />
                      </button>
                      <button
                        onClick={() => navigate(`/claims/${claim.id}`)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-medium hover:bg-indigo-100 transition inline-flex items-center space-x-1"
                      >
                        <span>Open</span>
                        <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Claim Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Submit New Claim</h3>
            <p className="text-xs text-slate-500 mb-4">Provide basic incident details to initiate AI investigation.</p>

            <form onSubmit={handleCreateClaim} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  <option value="auto">Auto / Motor Vehicle</option>
                  <option value="property">Property / Home</option>
                  <option value="health">Medical / Health</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Incident Date</label>
                <input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Estimated Amount ($)</label>
                <input
                  type="number"
                  value={estAmount}
                  onChange={(e) => setEstAmount(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Incident Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimsList;
