import { X } from 'lucide-react';
import type { Node } from '@xyflow/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface InspectorSidebarProps {
  node: Node | null;
  onClose: () => void;
  colorMode: 'light' | 'dark';
}

export function InspectorSidebar({ node, onClose, colorMode }: InspectorSidebarProps) {
  if (!node) return null;

  const nodeData = node.data as { type: string; label: string; raw: any };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tag': return 'bg-red-950/50 text-red-400 border border-red-500/50';
      case 'trigger': return 'bg-emerald-950/50 text-emerald-500 border border-emerald-500/50';
      case 'variable': return 'bg-blue-950/50 text-blue-400 border border-blue-500/50';
      default: return 'bg-gray-800 text-gray-400 border border-gray-600';
    }
  };

  // Detect if value looks like code (contains function, var, return, etc.)
  const isCodeLike = (value: string) => {
    if (!value || typeof value !== 'string') return false;
    return /\b(function|var|let|const|return|if|for|while)\b/.test(value) ||
           (value.includes('(') && value.includes(')'));
  };

  const bgColor = colorMode === 'dark' ? 'bg-[#0f1419]' : 'bg-white';
  const borderColor = colorMode === 'dark' ? 'border-slate-700/50' : 'border-slate-300';
  const hoverBg = colorMode === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100';
  const textPrimary = colorMode === 'dark' ? 'text-white' : 'text-slate-900';
  const textSecondary = colorMode === 'dark' ? 'text-slate-300' : 'text-slate-700';

  return (
    <div className={`fixed right-0 top-0 h-screen w-96 ${bgColor} shadow-2xl border-l ${borderColor} overflow-y-auto z-50`}>
      <div className={`sticky top-0 ${bgColor} border-b ${borderColor} p-4 flex items-center justify-between`}>
        <h2 className="text-xl font-bold text-emerald-500">Inspector</h2>
        <button
          onClick={onClose}
          className={`p-2 ${hoverBg} rounded-lg transition-colors text-emerald-500`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getTypeColor(nodeData.type)}`}>
            {nodeData.type.toUpperCase()}
          </span>
        </div>

        <h3 className={`text-lg font-bold ${textPrimary} mb-2`}>
          {nodeData.label}
        </h3>

        <div className="mt-6">
          <h4 className="text-sm font-semibold text-emerald-500 mb-2">Raw Configuration</h4>
          <div className={`rounded-lg overflow-hidden border ${borderColor}`}>
            <SyntaxHighlighter
              language="json"
              style={colorMode === 'dark' ? vscDarkPlus : vs}
              customStyle={{
                margin: 0,
                fontSize: '13px !important',
                borderRadius: '0.5rem',
                background: colorMode === 'dark' ? '#0a0e14' : '#f8fafc',
              }}
              codeTagProps={{
                style: {
                  fontSize: '13px',
                }
              }}
            >
              {JSON.stringify(nodeData.raw, null, 2)}
            </SyntaxHighlighter>
          </div>
        </div>

        {nodeData.raw.type && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-emerald-500 mb-1">Type</h4>
            <p className={`text-sm ${textSecondary}`}>{nodeData.raw.type}</p>
          </div>
        )}

        {nodeData.raw.firingTriggerId && nodeData.raw.firingTriggerId.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-emerald-500 mb-1">Firing Triggers</h4>
            <ul className={`list-disc list-inside text-sm ${textSecondary}`}>
              {nodeData.raw.firingTriggerId.map((id: string) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          </div>
        )}

        {nodeData.raw.parameter && nodeData.raw.parameter.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-emerald-500 mb-2">Parameters</h4>
            <div className="space-y-2">
              {nodeData.raw.parameter.map((param: { key: string; value: string }, idx: number) => {
                const paramValue = param.value || '';
                const paramBg = colorMode === 'dark' ? 'bg-[#1a2332]' : 'bg-slate-50';
                return (
                  <div key={idx} className={`${paramBg} rounded border ${borderColor} overflow-hidden`}>
                    <div className="px-2 pt-2 text-xs font-semibold text-emerald-500">{param.key}</div>
                    {isCodeLike(paramValue) ? (
                      <SyntaxHighlighter
                        language="javascript"
                        style={colorMode === 'dark' ? vscDarkPlus : vs}
                        customStyle={{
                          margin: 0,
                          fontSize: '12px !important',
                          padding: '8px',
                          background: colorMode === 'dark' ? '#0a0e14' : '#f1f5f9',
                        }}
                        codeTagProps={{
                          style: {
                            fontSize: '12px',
                          }
                        }}
                        wrapLongLines
                      >
                        {paramValue}
                      </SyntaxHighlighter>
                    ) : (
                      <div className={`px-2 pb-2 text-xs ${textSecondary} break-words`}>
                        {paramValue || '(empty)'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
