import { X } from 'lucide-react';
import type { Node } from '@xyflow/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useEffect, useRef, useState } from 'react';

interface InspectorSidebarProps {
  node: Node | null;
  isOpen: boolean;
  onClose: () => void;
  colorMode: 'light' | 'dark';
}

export function InspectorSidebar({ node, isOpen, onClose, colorMode }: InspectorSidebarProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const isDragging = useRef(false);
  const currentDragOffset = useRef(0); // Track offset in ref for event handlers

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && node && isOpen) {
        if (isExpanded) {
          setIsExpanded(false);
        } else {
          handleCloseInternal();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [node, isOpen, isExpanded]);

  // Prevent body scroll when panel is open on mobile
  useEffect(() => {
    if (node && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [node, isOpen]);

  const handleCloseInternal = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setDragOffset(0);
      setIsExpanded(false);
      currentDragOffset.current = 0;
    }, 200);
  };

  // Native touch event listeners for iOS compatibility (need passive: false)
  useEffect(() => {
    const handle = dragHandleRef.current;
    if (!handle || !node || !isOpen) return;

    let startExpanded = false;

    const onTouchStart = (e: TouchEvent) => {
      dragStartY.current = e.touches[0].clientY;
      isDragging.current = true;
      startExpanded = isExpanded;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || dragStartY.current === null) return;
      
      const currentY = e.touches[0].clientY;
      const diff = currentY - dragStartY.current;
      
      // Allow both up (negative) and down (positive) dragging
      e.preventDefault();
      currentDragOffset.current = diff;
      setDragOffset(diff);
    };

    const onTouchEnd = () => {
      if (!isDragging.current) return;
      
      const offset = currentDragOffset.current;
      isDragging.current = false;
      dragStartY.current = null;
      
      // Swipe down: close if not expanded, collapse if expanded
      if (offset > 100) {
        if (startExpanded) {
          setIsExpanded(false);
        } else {
          handleCloseInternal();
        }
      }
      // Swipe up: expand
      else if (offset < -100) {
        setIsExpanded(true);
      }
      
      currentDragOffset.current = 0;
      setDragOffset(0);
    };

    handle.addEventListener('touchstart', onTouchStart, { passive: true });
    handle.addEventListener('touchmove', onTouchMove, { passive: false });
    handle.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      handle.removeEventListener('touchstart', onTouchStart);
      handle.removeEventListener('touchmove', onTouchMove);
      handle.removeEventListener('touchend', onTouchEnd);
    };
  }, [node, isOpen, onClose]);

  // Reset state when node changes or panel opens
  useEffect(() => {
    if (node && isOpen) {
      setIsClosing(false);
      setDragOffset(0);
      setIsExpanded(false);
      currentDragOffset.current = 0;
    }
  }, [node, isOpen]);

  const handleClose = handleCloseInternal;

  if (!node || !isOpen) return null;

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

  // Calculate transform for drag gesture
  const panelTransform = dragOffset !== 0 ? `translateY(${dragOffset}px)` : undefined;
  
  // Mobile height class based on expanded state
  const mobileHeight = isExpanded ? 'max-h-[75vh]' : 'max-h-[30vh]';

  return (
    <>
      {/* Panel */}
      <div 
        ref={panelRef}
        className={`fixed z-50 ${bgColor} shadow-2xl overflow-y-auto overscroll-none
          /* Mobile: bottom sheet */
          inset-x-0 bottom-0 ${mobileHeight} rounded-t-2xl border-t ${borderColor}
          /* Desktop: right sidebar */
          md:inset-x-auto md:right-0 md:top-0 md:bottom-auto md:h-screen md:w-96 md:max-h-none md:rounded-none md:border-t-0 md:border-l
          /* Animation */
          transition-all duration-200 ease-out
          ${isClosing ? 'translate-y-full md:translate-y-0 md:translate-x-full' : 'translate-y-0 md:translate-x-0'}
        `}
        style={{ transform: panelTransform }}
      >
        {/* Drag handle - mobile only */}
        <div 
          ref={dragHandleRef}
          className="md:hidden flex items-center justify-center py-5 cursor-grab active:cursor-grabbing select-none touch-none"
        >
          <div className={`w-12 h-1.5 rounded-full ${colorMode === 'dark' ? 'bg-slate-500' : 'bg-slate-400'}`} />
        </div>

        <div className={`sticky top-0 ${bgColor} border-b ${borderColor} p-4 flex items-center justify-between`}>
          <h2 className="text-xl font-bold text-emerald-500">Inspector</h2>
          <button
            onClick={handleClose}
            className={`hidden md:block p-2 ${hoverBg} rounded-lg transition-colors text-emerald-500`}
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
    </>
  );
}
