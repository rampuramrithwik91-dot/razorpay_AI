import React, { useState } from 'react';
import { Share2, Smartphone, CreditCard, Globe, User, ShieldAlert, RefreshCw, ZoomIn, ZoomOut, Filter } from 'lucide-react';

export default function InteractiveGraph({ nodes = [], edges = [], selectedEntityId = "C-218", onSelectEntity }) {
  const [filterType, setFilterType] = useState('ALL');
  const [expanded, setExpanded] = useState(false);

  // Filter nodes relevant to selected entity or cluster
  const primaryNode = nodes.find(n => n.id === selectedEntityId) || nodes[0];
  
  // Direct connected edges
  const connectedEdges = edges.filter(e => e.source === selectedEntityId || e.target === selectedEntityId);
  const connectedNodeIds = new Set([
    selectedEntityId,
    ...connectedEdges.map(e => (e.source === selectedEntityId ? e.target : e.source))
  ]);

  const displayNodes = expanded 
    ? nodes.filter(n => filterType === 'ALL' || n.type === filterType)
    : nodes.filter(n => connectedNodeIds.has(n.id) && (filterType === 'ALL' || n.type === filterType));

  const displayEdges = edges.filter(e => connectedNodeIds.has(e.source) && connectedNodeIds.has(e.target));

  const getNodeIcon = (type) => {
    switch (type) {
      case 'CUSTOMER': return User;
      case 'DEVICE': return Smartphone;
      case 'CARD': return CreditCard;
      case 'IP': return Globe;
      default: return Share2;
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'CRITICAL': return 'border-red-500 bg-red-950/60 text-red-300 shadow-red-500/20';
      case 'HIGH': return 'border-orange-500 bg-orange-950/60 text-orange-300 shadow-orange-500/20';
      case 'MEDIUM': return 'border-amber-500 bg-amber-950/60 text-amber-300 shadow-amber-500/20';
      case 'LOW': return 'border-emerald-500 bg-emerald-950/60 text-emerald-300 shadow-emerald-500/20';
      default: return 'border-cyan-500 bg-cyan-950/60 text-cyan-300 shadow-cyan-500/20';
    }
  };

  return (
    <div className="card-panel p-5 relative overflow-hidden">
      {/* Graph Toolbar Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#242F42]">
        <div className="flex items-center gap-2.5">
          <Share2 className="w-5 h-5 text-cyan-400" />
          <div>
            <h4 className="text-sm font-bold text-white">Entity Relationship Graph</h4>
            <p className="text-xs text-slate-400">
              Showing cluster for <span className="font-mono text-cyan-300 font-semibold">{selectedEntityId}</span>
            </p>
          </div>
        </div>

        {/* Graph Controls */}
        <div className="flex items-center gap-2">
          {/* Node Filter */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
            {['ALL', 'CUSTOMER', 'DEVICE', 'CARD'].map(ft => (
              <button
                key={ft}
                onClick={() => setFilterType(ft)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                  filterType === ft ? 'bg-cyan-900 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ft}
              </button>
            ))}
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-all"
          >
            {expanded ? 'Collapse Graph' : 'Expand Network'}
          </button>
        </div>
      </div>

      {/* Visual Entity Graph Canvas Representation */}
      <div className="min-h-[280px] bg-[#090D14] rounded-xl border border-[#1E293B] p-6 relative flex flex-wrap items-center justify-center gap-8">
        
        {/* Connection Edge Badges */}
        <div className="absolute top-3 left-4 flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {displayNodes.length} Nodes Loaded
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {displayEdges.length} Active Edges
          </span>
        </div>

        {displayNodes.map((node) => {
          const Icon = getNodeIcon(node.type);
          const isSelected = node.id === selectedEntityId;
          const riskStyle = getRiskColor(node.risk_level);

          return (
            <div
              key={node.id}
              onClick={() => onSelectEntity && onSelectEntity(node.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-105 shadow-lg flex items-center gap-3 ${riskStyle} ${
                isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#090D14] scale-105' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center">
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-white">{node.id}</span>
                  {node.risk_level && (
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/50 font-semibold">
                      {node.risk_level}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 truncate max-w-[120px]">{node.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edge Relationships Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400 border-t border-[#1E293B] pt-3">
        <span className="font-medium text-slate-300">Connected Relationships:</span>
        {displayEdges.map((edge) => (
          <span key={edge.id} className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#162032] border border-[#23334D] text-cyan-300">
            {edge.source} ↔ {edge.target} ({edge.type})
          </span>
        ))}
      </div>
    </div>
  );
}
