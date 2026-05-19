import { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { GraphData } from '@workspace/api-client-react';

interface NetworkGraphProps {
  data: GraphData;
  width?: number;
  height?: number;
}

export function NetworkGraph({ data, width = 800, height = 600 }: NetworkGraphProps) {
  const fgRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width, height });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height: height || 500 });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Format data for the graph
  const graphData = {
    nodes: data.nodes.map(n => ({ ...n, val: n.type === 'faculty' ? 10 : 5 })),
    links: data.edges.map(e => ({ ...e, source: e.source, target: e.target }))
  };

  return (
    <div ref={containerRef} className="w-full h-full min-h-[500px] rounded-xl overflow-hidden bg-black/20 border border-white/5 relative">
      <div className="absolute top-4 left-4 z-10 flex gap-4 text-xs bg-black/40 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500"></div> Faculty</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-cyan-400"></div> Keyword</div>
      </div>
      
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeLabel="label"
        nodeColor={(node: any) => node.type === 'faculty' ? '#6366f1' : '#22d3ee'}
        nodeRelSize={6}
        linkColor={() => 'rgba(255,255,255,0.2)'}
        linkWidth={(link: any) => link.weight ? Math.min(link.weight, 5) : 1}
        backgroundColor="transparent"
        onNodeClick={(node: any) => {
          fgRef.current?.centerAt(node.x, node.y, 1000);
          fgRef.current?.zoom(4, 2000);
        }}
      />
    </div>
  );
}
