import React, { useState, useEffect } from 'react';
import { Share2, Search, User, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import InteractiveGraph from '../components/InteractiveGraph';
import { fetchJson } from '../utils/api';

export default function EntityExplorer() {
  const [selectedEntityId, setSelectedEntityId] = useState("C-218");
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [entityDetail, setEntityDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async (eid) => {
    try {
      setLoading(true);
      const [gData, eData] = await Promise.all([
        fetchJson(`/graph?selected_entity_id=${eid}`),
        fetchJson(`/entities/${eid}`)
      ]);
      setGraphData(gData);
      setEntityDetail(eData);
    } catch (err) {
      console.error("Error fetching entity details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedEntityId);
  }, [selectedEntityId]);

  const handleSelect = (eid) => {
    if (eid && eid.startsWith('C-')) {
      setSelectedEntityId(eid);
    }
  };

  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header & Entity Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Share2 className="w-5 h-5 text-cyan-400" />
            Entity History & Relationship Explorer
          </h1>
          <p className="text-xs text-slate-400">Unified entity timeline across payments, returns, chargebacks, and risk versioning</p>
        </div>

        {/* Entity Selector Quick Chips */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Quick Select:</span>
          {['C-218', 'C-104', 'C-309', 'C-402', 'C-511'].map(eid => (
            <button
              key={eid}
              onClick={() => setSelectedEntityId(eid)}
              className={`px-2.5 py-1 rounded-md transition-all ${
                selectedEntityId === eid ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {eid}
            </button>
          ))}
        </div>
      </div>

      {/* Graph Visualizer */}
      <InteractiveGraph 
        nodes={graphData.nodes}
        edges={graphData.edges}
        selectedEntityId={selectedEntityId}
        onSelectEntity={handleSelect}
      />

      {/* UNIFIED ENTITY TIMELINE */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono animate-pulse">Loading Unified Timeline for {selectedEntityId}...</div>
      ) : entityDetail ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Entity Context Card */}
          <div className="card-panel p-5 space-y-4">
            <div className="pb-3 border-b border-[#242F42]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                Entity Master Profile
              </h3>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between p-2.5 rounded-lg bg-[#0F1522]">
                <span className="text-slate-400">ID:</span>
                <span className="text-cyan-300 font-bold">{entityDetail.entity.id}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-[#0F1522]">
                <span className="text-slate-400">Name:</span>
                <span className="text-white font-bold">{entityDetail.entity.name}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-[#0F1522]">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-300">{entityDetail.entity.email}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-[#0F1522]">
                <span className="text-slate-400">Unified Risk Level:</span>
                <span className={`px-2 py-0.5 rounded font-bold ${
                  entityDetail.entity.risk_level === 'CRITICAL' ? 'badge-critical' : 'badge-high'
                }`}>
                  {entityDetail.entity.risk_level} ({entityDetail.entity.score})
                </span>
              </div>
            </div>
          </div>

          {/* Unified Chronological Event History */}
          <div className="card-panel p-5 lg:col-span-2 space-y-4">
            <div className="pb-3 border-b border-[#242F42]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Unified Event History Timeline
              </h3>
              <p className="text-xs text-slate-400">Consistent timeline matching live feed, graph, and audit records</p>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {entityDetail.timeline.map((ev, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#0F1522] border border-[#1E293B] flex items-start justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        ev.type === 'PAYMENT' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' :
                        ev.type === 'RETURN' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        ev.type === 'DISPUTE' ? 'bg-red-950 text-red-300 border border-red-800' :
                        'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      }`}>
                        {ev.type}
                      </span>
                      <span className="font-semibold text-white">{ev.title}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] font-mono">{ev.details}</p>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 shrink-0">{ev.timestamp.split('T')[0]}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : null}

    </div>
  );
}
