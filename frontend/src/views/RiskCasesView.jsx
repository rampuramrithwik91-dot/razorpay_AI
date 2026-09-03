import React, { useState, useEffect } from 'react';
import { AlertTriangle, Filter, Search, ChevronRight, ArrowUpDown } from 'lucide-react';
import { API_BASE, fetchJson } from '../utils/api';

export default function RiskCasesView({ onSelectCase }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCases = async () => {
    try {
      setLoading(true);
      const url = `/cases?domain=${domainFilter}&severity=${severityFilter}&status=${statusFilter}`;
      const data = await fetchJson(url);
      setCases(data);
    } catch (err) {
      console.error("Error fetching cases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [domainFilter, severityFilter, statusFilter]);

  const filteredCases = cases.filter(c => 
    c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.entity_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-indigo-400" />
            Risk Cases Queue
          </h1>
          <p className="text-xs text-slate-400">Reconciled review queue driven directly by the database data layer</p>
        </div>

        <div className="text-xs font-mono text-cyan-300 bg-cyan-950 border border-cyan-800 px-3 py-1.5 rounded-lg">
          Total Cases Loaded: {filteredCases.length}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card-panel p-4 flex flex-wrap items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Case ID, Entity, Title..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-[#0F1522] border border-[#253247] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-3 text-xs">
          
          {/* Domain Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Domain:</span>
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="bg-[#0F1522] border border-[#253247] text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none font-mono"
            >
              <option value="ALL">All Domains</option>
              <option value="UNIFIED">UNIFIED</option>
              <option value="FRAUD_ABUSE">FRAUD_ABUSE</option>
              <option value="RETURN_REFUND">RETURN_REFUND</option>
              <option value="DISPUTE_INTEL">DISPUTE_INTEL</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-[#0F1522] border border-[#253247] text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none font-mono"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0F1522] border border-[#253247] text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none font-mono"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_REVIEW">IN_REVIEW</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="DISMISSED">DISMISSED</option>
            </select>
          </div>

        </div>

      </div>

      {/* Cases Table */}
      <div className="card-panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono animate-pulse">Loading Risk Cases...</div>
        ) : filteredCases.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-mono">No cases match the selected filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F1522] text-slate-400 font-mono uppercase text-[11px] border-b border-[#242F42]">
                <tr>
                  <th className="p-3.5">Case ID</th>
                  <th className="p-3.5">Title & Summary</th>
                  <th className="p-3.5">Domain</th>
                  <th className="p-3.5">Severity</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Entity</th>
                  <th className="p-3.5 text-right">Exposure</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F293D]">
                {filteredCases.map((c) => (
                  <tr 
                    key={c.id} 
                    onClick={() => onSelectCase(c.id)}
                    className="hover:bg-[#1A2334] cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 font-mono font-bold text-cyan-300">
                      {c.id}
                      {c.id === "RC-2048" && (
                        <span className="ml-2 text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                          HERO
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-medium text-white max-w-sm truncate">{c.title}</td>
                    <td className="p-3.5 font-mono text-slate-300">{c.domain}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        c.severity === 'CRITICAL' ? 'badge-critical' : c.severity === 'HIGH' ? 'badge-high' : 'badge-medium'
                      }`}>
                        {c.severity}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        c.status === 'OPEN' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">{c.entity_name} ({c.entity_id})</td>
                    <td className="p-3.5 text-right font-mono font-bold text-white">{formatINR(c.exposure_amount)}</td>
                    <td className="p-3.5 text-center">
                      <button className="px-3 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-[11px] font-mono border border-cyan-800 transition-colors">
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
