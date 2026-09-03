import React, { useState, useEffect } from 'react';
import { Settings, Shield, CheckCircle2, Play } from 'lucide-react';

export default function PolicyEngine() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/policies')
      .then(res => res.json())
      .then(data => setPolicies(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            Merchant Policy & Rules Engine
          </h1>
          <p className="text-xs text-slate-400">Automated policy decision rules across payments, return abuse, and chargebacks</p>
        </div>

        <div className="text-xs font-mono text-cyan-300 bg-cyan-950 border border-cyan-800 px-3 py-1.5 rounded-lg">
          Active Rules: {policies.filter(p => p.is_active).length}
        </div>
      </div>

      {/* Rules Table */}
      <div className="card-panel p-5">
        <div className="pb-4 mb-4 border-b border-[#242F42]">
          <h3 className="text-sm font-bold text-white">Active Policy Definitions</h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono animate-pulse">Loading Policy Engine...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F1522] text-slate-400 font-mono uppercase text-[11px] border-b border-[#242F42]">
                <tr>
                  <th className="p-3.5">Policy ID</th>
                  <th className="p-3.5">Rule Name</th>
                  <th className="p-3.5">Domain</th>
                  <th className="p-3.5">Trigger Condition</th>
                  <th className="p-3.5">Action Executed</th>
                  <th className="p-3.5 text-right">Execution Count</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F293D]">
                {policies.map((p) => (
                  <tr key={p.id} className="hover:bg-[#1A2334] transition-colors">
                    <td className="p-3.5 font-mono font-bold text-cyan-300">{p.id}</td>
                    <td className="p-3.5 font-medium text-white">{p.name}</td>
                    <td className="p-3.5 font-mono text-slate-300">{p.domain}</td>
                    <td className="p-3.5 font-mono text-slate-300">{p.trigger_condition}</td>
                    <td className="p-3.5 font-mono text-amber-400">{p.action}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-white">{p.execute_count}</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        ACTIVE
                      </span>
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
