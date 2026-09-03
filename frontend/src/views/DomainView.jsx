import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, Scale, Info, ArrowUpRight } from 'lucide-react';
import { fetchJson } from '../utils/api';

export default function DomainView({ domainKey = "FRAUD_ABUSE", onSelectCase }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDomainData = async () => {
    try {
      setLoading(true);
      const json = await fetchJson(`/analytics/${domainKey}`);
      setData(json);
    } catch (err) {
      console.error("Error fetching domain analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomainData();
  }, [domainKey]);

  if (loading) {
    return <div className="p-12 text-center text-slate-400 font-mono animate-pulse">Loading Domain Analytics...</div>;
  }

  if (!data) return null;

  const getDomainIcon = () => {
    switch (domainKey) {
      case 'FRAUD_ABUSE': return ShieldAlert;
      case 'RETURN_REFUND': return RefreshCw;
      case 'DISPUTE_INTEL': return Scale;
      default: return ShieldAlert;
    }
  };

  const getDomainTitle = () => {
    switch (domainKey) {
      case 'FRAUD_ABUSE': return 'Fraud & Coordinated Abuse Intelligence';
      case 'RETURN_REFUND': return 'Returns & Refund Abuse Operations';
      case 'DISPUTE_INTEL': return 'Dispute & Pre-Arbitration Intelligence';
      default: return 'Risk Domain Intelligence';
    }
  };

  const Icon = getDomainIcon();
  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Domain Header Banner */}
      <div className="card-panel p-6 bg-gradient-to-r from-[#141C2B] via-[#1A2538] to-[#121824] border-l-4 border-l-cyan-400">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{getDomainTitle()}</h1>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                DISTINCT DOMAIN WORKFLOW
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">{data.explanation}</p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="card-panel p-5 border-l-4 border-l-red-500">
          <span className="text-xs font-mono text-slate-400">TOTAL DOMAIN EXPOSURE</span>
          <div className="text-2xl font-bold text-white font-mono mt-2">
            {formatINR(data.metrics.total_exposure)}
          </div>
          <span className="text-xs text-slate-400">Calculated sum of active open cases</span>
        </div>

        <div className="card-panel p-5 border-l-4 border-l-indigo-500">
          <span className="text-xs font-mono text-slate-400 font-medium">OPEN DOMAIN CASES</span>
          <div className="text-2xl font-bold text-white font-mono mt-2">
            {data.metrics.open_cases_count}
          </div>
          <span className="text-xs text-slate-400">Active incidents requiring investigation</span>
        </div>
      </div>

      {/* Domain Workflow Table */}
      <div className="card-panel p-5">
        <div className="pb-4 mb-4 border-b border-[#242F42]">
          <h3 className="text-sm font-bold text-white">Active Incidents in {domainKey}</h3>
          <p className="text-xs text-slate-400">Isolated domain incidents reconciled with global unified risk score</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0F1522] text-slate-400 font-mono uppercase text-[11px] border-b border-[#242F42]">
              <tr>
                <th className="p-3">Case ID</th>
                <th className="p-3">Incident Title</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Customer Entity</th>
                <th className="p-3 text-right">Exposure</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F293D]">
              {data.cases.map((c) => (
                <tr key={c.id} onClick={() => onSelectCase(c.id)} className="hover:bg-[#1A2334] cursor-pointer transition-colors">
                  <td className="p-3 font-mono font-bold text-cyan-300">{c.id}</td>
                  <td className="p-3 font-medium text-white max-w-xs truncate">{c.title}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      c.severity === 'CRITICAL' ? 'badge-critical' : 'badge-high'
                    }`}>
                      {c.severity}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300 font-mono">{c.entity_name} ({c.entity_id})</td>
                  <td className="p-3 text-right font-mono font-bold text-white">{formatINR(c.exposure_amount)}</td>
                  <td className="p-3 text-center">
                    <button className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-[11px] font-mono border border-cyan-800 transition-colors">
                      Investigate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Domain Specific Callout */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300">
          <span className="font-semibold text-white">Why This Domain Matters:</span> {data.explanation}
        </div>
      </div>

    </div>
  );
}
