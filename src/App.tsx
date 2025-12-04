import { useState } from 'react';
import type { Node } from '@xyflow/react';
import { FileUploader } from './components/FileUploader';
import { GraphCanvas } from './components/GraphCanvas';
import { InspectorSidebar } from './components/InspectorSidebar';
import type { GTMExport, ContainerInfo } from './types/gtm';
import { parseGTMJson } from './utils/parseGTM';

function App() {
  const [parsedData, setParsedData] = useState<{ nodes: Node[]; edges: any[] } | null>(null);
  const [containerInfo, setContainerInfo] = useState<ContainerInfo | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('dark');

  const handleFileLoad = (data: GTMExport) => {
    const parsed = parseGTMJson(data);
    setParsedData(parsed);
    
    // Extract container info
    setContainerInfo({
      name: data.containerVersion?.container?.name || 'Unknown Container',
      publicId: data.containerVersion?.container?.publicId || '',
      version: data.containerVersion?.containerVersionId || '',
      exportTime: data.exportTime || '',
    });
  };

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
    setIsPanelOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsPanelOpen(false);
    // Node stays selected, panel just closes
  };

  return (
    <div className="relative">
      {!parsedData ? (
        <FileUploader onFileLoad={handleFileLoad} />
      ) : (
        <>
          <GraphCanvas
            nodes={parsedData.nodes}
            edges={parsedData.edges}
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedNode?.id || null}
            colorMode={colorMode}
            setColorMode={setColorMode}
            containerInfo={containerInfo}
          />
          <InspectorSidebar
            node={selectedNode}
            isOpen={isPanelOpen}
            onClose={handleCloseSidebar}
            colorMode={colorMode}
          />
        </>
      )}
    </div>
  );
}

export default App;
