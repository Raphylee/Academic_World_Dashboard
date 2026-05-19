import { useState } from "react";
import { 
  useNeo4jCollaborationNetwork,
  useNeo4jFacultyKeywords,
  useNeo4jResearchPath,
  useNeo4jNetworkCentrality,
  useNeo4jResearchClusters
} from "@workspace/api-client-react";
import { NetworkGraph } from "@/components/network-graph";
import { Network, Search, GitMerge, Loader2, Maximize2, Users, Layers } from "lucide-react";
import { motion } from "framer-motion";

const Badge = ({ children, tooltip }: { children: React.ReactNode, tooltip?: string }) => (
  <div className="group relative flex items-center">
    <span className="text-[10px] font-mono bg-white/5 border border-white/10 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
      {children}
    </span>
    {tooltip && (
      <div className="absolute right-0 top-full mt-2 w-64 p-2 bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        {tooltip}
      </div>
    )}
  </div>
);

export default function Neo4jExplorer() {
  const [networkInput, setNetworkInput] = useState("Jiawei Han");
  const [networkQuery, setNetworkQuery] = useState("Jiawei Han");

  const [pathFrom, setPathFrom] = useState("Jiawei Han");
  const [pathTo, setPathTo] = useState("Dan Roth");
  const [pathQuery, setPathQuery] = useState({ from: "Jiawei Han", to: "Dan Roth" });
  
  const [clusterInput, setClusterInput] = useState("machine learning");
  const [clusterQuery, setClusterQuery] = useState("machine learning");

  const { data: networkData, isLoading: isLoadingNetwork } = useNeo4jCollaborationNetwork(
    { facultyName: networkQuery, depth: 1 },
    { query: { enabled: !!networkQuery } }
  );

  const { data: facultyKeywords, isLoading: isLoadingKeywords } = useNeo4jFacultyKeywords(
    { facultyName: networkQuery, limit: 15 },
    { query: { enabled: !!networkQuery } }
  );

  const { data: pathData, isLoading: isLoadingPath, isFetching: isFetchingPath } = useNeo4jResearchPath(
    { from: pathQuery.from, to: pathQuery.to },
    { query: { enabled: !!pathQuery.from && !!pathQuery.to } }
  );
  
  const { data: centralityData, isLoading: isLoadingCentrality } = useNeo4jNetworkCentrality({ limit: 12 });
  
  const { data: clusterData, isLoading: isLoadingCluster } = useNeo4jResearchClusters(
    { keyword: clusterQuery, limit: 8 },
    { query: { enabled: !!clusterQuery } }
  );

  const handleNetworkSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (networkInput) setNetworkQuery(networkInput);
  };

  const handlePathSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (pathFrom && pathTo) setPathQuery({ from: pathFrom, to: pathTo });
  };
  
  const handleClusterSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (clusterInput) setClusterQuery(clusterInput);
  };

  return (
    <div className="space-y-6 pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3 mb-2">
          <Network className="text-indigo-400 w-8 h-8" /> Neo4j Explorer
        </h1>
        <p className="text-muted-foreground">
          Graph databases model relationships natively. Neo4j is perfect for uncovering hidden connections, 
          finding shortest paths between researchers, and discovering highly connected central hubs within the collaboration network.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left/Main Column (2/3 width) */}
        <div className="xl:col-span-2 space-y-6">
          
          <div className="glass-panel p-2 rounded-2xl flex flex-col h-[600px] border-indigo-500/20">
            <div className="px-4 pt-4 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-display font-semibold flex items-center gap-2">
                 Collaboration Network
              </h2>
              <div className="flex items-center gap-3">
                <form onSubmit={handleNetworkSearch} className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text"
                    placeholder="Center node (faculty name)..."
                    value={networkInput}
                    onChange={(e) => setNetworkInput(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 transition-all"
                  />
                </form>
                <Badge>Ego Graph: 1-hop MATCH pattern</Badge>
              </div>
            </div>

            <div className="flex-1 relative rounded-xl overflow-hidden m-2 bg-black/50">
              {isLoadingNetwork ? (
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 text-indigo-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-sm font-medium animate-pulse">Computing graph layout...</span>
                </div>
              ) : networkData && networkData.nodes.length > 0 ? (
                <NetworkGraph data={networkData} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                  No network data found for "{networkQuery}".
                </div>
              )}
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg text-xs text-slate-400 border border-white/10 flex items-center gap-2">
                <Maximize2 className="w-3 h-3" /> Scroll to zoom, drag to pan
              </div>
            </div>
          </div>
          
          <div className="glass-panel p-6 rounded-2xl border-indigo-500/20">
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
              <h2 className="text-xl font-display font-semibold flex items-center gap-2">
                <Users className="text-indigo-400" /> Degree Centrality Leaderboard
              </h2>
              <Badge>Degree Centrality: COUNT(DISTINCT coauthor)</Badge>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-white/5 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Rank</th>
                    <th className="px-4 py-3">Faculty</th>
                    <th className="px-4 py-3">University</th>
                    <th className="px-4 py-3 text-right">Collaborators (Degree)</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Shared Pubs</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingCentrality ? (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
                  ) : centralityData?.map((faculty, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-400">#{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-indigo-300">{faculty.name}</td>
                      <td className="px-4 py-3 text-slate-400">{faculty.university || 'Unknown'}</td>
                      <td className="px-4 py-3 text-right font-bold text-white">{faculty.degree}</td>
                      <td className="px-4 py-3 text-right text-slate-400">{faculty.sharedPubs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          
          {/* Semantic Keyword Cloud */}
          <div className="glass-panel p-6 rounded-2xl border-cyan-500/20">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-display font-semibold text-white">Semantic Cloud</h2>
              <Badge>Graph Traversal: MATCH (f)-[:RESEARCH_INTEREST]-&gt;(k)</Badge>
            </div>
            <p className="text-xs text-slate-400 mb-4">Graph-derived topics for <strong>{networkQuery}</strong></p>
            
            <div className="flex flex-wrap gap-2">
              {isLoadingKeywords ? (
                <div className="w-full py-4 text-center"><Loader2 className="w-5 h-5 animate-spin text-cyan-400 mx-auto" /></div>
              ) : facultyKeywords?.length ? (
                facultyKeywords.map((kw, idx) => {
                  const maxScore = Math.max(...facultyKeywords.map(k => k.score));
                  const relativeScore = kw.score / maxScore;
                  return (
                    <span 
                      key={kw.keyword} 
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-100 whitespace-nowrap"
                      style={{
                        fontSize: `${0.75 + (relativeScore * 0.4)}rem`,
                        opacity: 0.5 + (relativeScore * 0.5)
                      }}
                    >
                      {kw.keyword}
                    </span>
                  )
                })
              ) : (
                <div className="text-sm text-slate-500 w-full text-center py-4">No associated keywords found.</div>
              )}
            </div>
          </div>
          
          {/* Research Cluster */}
          <div className="glass-panel p-6 rounded-2xl border-purple-500/20">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-display font-semibold flex items-center gap-2">
                <Layers className="text-purple-400" /> Research Cluster
              </h2>
            </div>
            <div className="mb-4">
              <Badge>Graph Pattern: MATCH (f)-[:RESEARCH_INTEREST]-&gt;(k)</Badge>
            </div>
            
            <form onSubmit={handleClusterSearch} className="relative w-full mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Find cluster by keyword..."
                value={clusterInput}
                onChange={(e) => setClusterInput(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400 transition-all"
              />
            </form>
            
            <div className="space-y-3 mt-4">
              {isLoadingCluster ? (
                <div className="w-full py-4 text-center"><Loader2 className="w-5 h-5 animate-spin text-purple-400 mx-auto" /></div>
              ) : clusterData?.length ? (
                clusterData.map((member, idx) => {
                  const maxScore = clusterData[0].score;
                  const pct = (member.score / maxScore) * 100;
                  return (
                    <div key={idx} className="relative w-full bg-black/30 rounded-lg p-2 border border-white/5 overflow-hidden group">
                      <div 
                        className="absolute inset-y-0 left-0 bg-purple-500/20 z-0 transition-all duration-1000"
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative z-10 flex justify-between items-center">
                        <div className="text-sm font-medium text-slate-200 truncate">{member.name}</div>
                        <div className="text-xs text-purple-300 font-bold ml-2">{member.score}</div>
                      </div>
                      <div className="relative z-10 text-[10px] text-slate-400 truncate mt-0.5">{member.university || 'Unknown'}</div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-slate-500 w-full text-center py-4">No cluster members found.</div>
              )}
            </div>
          </div>

          {/* Research Path Finder */}
          <div className="glass-panel p-6 rounded-2xl border-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <h2 className="text-xl font-display font-semibold flex items-center gap-2">
                <GitMerge className="text-indigo-400" /> Shortest Path
              </h2>
            </div>
            <div className="mb-4 relative z-10">
              <Badge>shortestPath() — graph-native BFS</Badge>
            </div>
            
            <form onSubmit={handlePathSearch} className="space-y-3 relative z-10">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block uppercase tracking-wider">Start Node</label>
                <input 
                  type="text"
                  value={pathFrom}
                  onChange={(e) => setPathFrom(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-400 transition-all"
                />
              </div>
              <div className="flex justify-center -my-2 relative z-20">
                <div className="bg-card border border-white/10 p-1 rounded-full"><GitMerge className="w-3 h-3 text-slate-500 rotate-90" /></div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block uppercase tracking-wider">Target Node</label>
                <input 
                  type="text"
                  value={pathTo}
                  onChange={(e) => setPathTo(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-400 transition-all"
                />
              </div>
              <button 
                type="submit"
                disabled={isFetchingPath}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-indigo-900/20"
              >
                {isFetchingPath ? <Loader2 className="w-4 h-4 animate-spin" /> : "Find Path"}
              </button>
            </form>

            <div className="mt-8 relative z-10">
              {isLoadingPath ? (
                 <div className="text-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto" /></div>
              ) : pathData && pathData.path && pathData.path.length > 0 ? (
                <div>
                  <div className="text-xs text-indigo-300 font-medium mb-4 uppercase tracking-wider text-center bg-indigo-500/10 py-1.5 rounded border border-indigo-500/20">
                    Degrees of Separation: {pathData.length}
                  </div>
                  <div className="space-y-0 relative">
                    {pathData.path.map((node, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="flex items-start gap-4 relative"
                      >
                        <div className="flex flex-col items-center min-w-[24px]">
                          <div className={`w-3 h-3 rounded-full mt-1.5 z-10 ${i === 0 || i === pathData.path.length - 1 ? 'bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]' : 'bg-slate-600'}`} />
                          {i < pathData.path.length - 1 && <div className="absolute top-4 left-[11px] bottom-[-16px] w-0.5 bg-gradient-to-b from-indigo-500/50 to-slate-700/50" />}
                        </div>
                        <div className={`text-sm pb-6 ${i === 0 || i === pathData.path.length - 1 ? 'text-white font-bold' : 'text-slate-300 font-medium'} pt-1`}>
                          {node}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : pathQuery.from !== "" ? (
                <div className="text-center text-sm text-slate-500 bg-black/20 py-4 rounded-lg border border-white/5">No path exists between them.</div>
              ) : null}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
