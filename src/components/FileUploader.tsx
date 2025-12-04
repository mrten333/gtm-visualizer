import { Upload, Lock, Play } from 'lucide-react';
import type { GTMExport } from '../types/gtm';

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, string>) => void;
    };
  }
}

interface FileUploaderProps {
  onFileLoad: (data: GTMExport) => void;
}

export function FileUploader({ onFileLoad }: FileUploaderProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        window.umami?.track('gtm-viz-start', { method: 'file_upload' });
        onFileLoad(json);
      } catch (error) {
        alert('Error parsing JSON file. Please ensure it is a valid GTM export.');
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          window.umami?.track('gtm-viz-start', { method: 'file_upload' });
          onFileLoad(json);
        } catch (error) {
          alert('Error parsing JSON file. Please ensure it is a valid GTM export.');
          console.error(error);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLoadDemo = async () => {
    try {
      // Use relative path to work with Vite's base: './' configuration
      const response = await fetch('./demo-gtm-export.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const demoData = await response.json();
      window.umami?.track('gtm-viz-start', { method: 'demo' });
      onFileLoad(demoData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error loading demo data: ${errorMessage}`);
      console.error('Demo load error:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f1419] p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="p-8 bg-[#1a2332] rounded-lg shadow-lg border-2 border-dashed border-slate-700 hover:border-emerald-500 transition-colors"
        >
          <div className="text-center">
            <Upload className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
            <h2 className="text-2xl font-bold text-emerald-500 mb-2">
              Upload GTM Export
            </h2>
            <p className="text-slate-400 mb-6">
              Drag and drop your GTM container JSON file here, or click to browse
            </p>
            <div className="flex flex-col gap-3">
              <label className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg cursor-pointer hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/30">
                Choose File
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleLoadDemo}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              >
                <Play className="w-4 h-4" />
                View Demo
              </button>
              <p className="text-xs text-slate-500 mt-1">
                Demo data is for visualization only
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="flex items-start gap-3 p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-lg">
          <Lock className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-emerald-500 mb-1">Privacy First</h3>
            <p className="text-xs text-slate-400">
              Your data never leaves your browser. All processing happens locally on your device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
