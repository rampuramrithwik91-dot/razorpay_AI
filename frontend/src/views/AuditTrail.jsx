import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, ShieldCheck, Clock } from 'lucide-react';
import { fetchJson } from '../utils/api';

export default function AuditTrail() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAudit = async () => {
    try {
      setLoading(true);
      const data = await fetchJson('/audit');
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  const filteredEvents = events.filter(e => {
    const matchesType = eventTypeFilter === 'ALL' || e.event_type === eventTypeFilter;
    const matchesSearch = !searchTerm || 
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.entity_id && e.entity_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.case_id && e.case_id.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            System Audit Trail & State Transitions
          </h1>
          <p className="text-xs text-slate-400">Tamper-evident system decisions and human reviewer actions log</p>
        </div>

        <div className="text-xs font-mono text-cyan-300 bg-cyan-950 border border-cyan-800 px-3 py-1.5 rounded-lg">
          Total Audit Records: {filteredEvents.length}
        </div>
      </div>

      {/* Filter & Search */}
      <div className="card-panel p-4 flex flex-wrap items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Case ID, Entity ID, Description..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-[#0F1522] border border-[#253247] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Event Type Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Event Type:</span>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="bg-[#0F1522] border border-[#253247] text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none font-mono"
          >
            <option value="ALL">All Event Types</option>
            <option value="EVENT_RECEIVED">EVENT_RECEIVED</option>
            <option value="RISK_DETECTED">RISK_DETECTED</option>
            <option value="CASE_CREATED">CASE_CREATED</option>
            <option value="AI_INVESTIGATED">AI_INVESTIGATED</option>
            <option value="POLICY_EVALUATED">POLICY_EVALUATED</option>
            <option value="HUMAN_REVIEWED">HUMAN_REVIEWED</option>
            <option value="CASE_RESOLVED">CASE_RESOLVED</option>
          </select>
        </div>

      </div>

      {/* Audit Log Table */}
      <div className="card-panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono animate-pulse">Loading System Audit Trail...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-mono">No audit events match the selected criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F1522] text-slate-400 font-mono uppercase text-[11px] border-b border-[#242F42]">
                <tr>
                  <th className="p-3.5">ID</th>
                  <th className="p-3.5">Event Type</th>
                  <th className="p-3.5">Case ID</th>
                  <th className="p-3.5">Entity ID</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F293D]">
                {filteredEvents.map((e) => (
                  <tr key={e.id} className="hover:bg-[#1A2334] transition-colors">
                    <td className="p-3.5 font-mono text-slate-500">#{e.id}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        e.event_type === 'RISK_DETECTED' ? 'badge-critical' :
                        e.event_type === 'CASE_CREATED' ? 'badge-high' :
                        e.event_type === 'HUMAN_REVIEWED' ? 'badge-medium' :
                        'badge-info'
                      }`}>
                        {e.event_type}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-cyan-300">{e.case_id || '-'}</td>
                    <td className="p-3.5 font-mono text-slate-300">{e.entity_id || '-'}</td>
                    <td className="p-3.5 text-white font-medium max-w-md">{e.description}</td>
                    <td className="p-3.5 text-right font-mono text-slate-400">
                      {e.timestamp.replace('T', ' ').substring(0, 19)}
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
