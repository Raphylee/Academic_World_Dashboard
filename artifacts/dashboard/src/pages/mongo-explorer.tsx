import { useState } from "react";
import { 
  useMongoPublicationDetails,
  useMongoFacultyKeywordScores,
  useMongoKeywordStats,
  useMongoYearActivity,
  useMongoVenueAnalysis
} from "@workspace/api-client-react";
import { Search, FileText, BarChart3, DatabaseZap, Quote, Loader2, Globe } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, AreaChart, Area } from "recharts";

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

export default function MongoExplorer() {
  const [pubSearch, setPubSearch] = useState("neural");
  const [searchInput, setSearchInput] = useState("neural");
  
  const [keywordStatsInput, setKeywordStatsInput] = useState("nlp");
  const [keywordStatsQuery, setKeywordStatsQuery] = useState("nlp");

  const { data: pubDetails, isLoading: isLoadingPubs } = useMongoPublicationDetails(
    { q: pubSearch, limit: 10 },
    { query: { enabled: !!pubSearch } }
  );

  const { data: keywordStats, isLoading: isLoadingStats } = useMongoKeywordStats(
    { keyword: keywordStatsQuery },
    { query: { enabled: !!keywordStatsQuery } }
  );

  const { data: facultyScores, isLoading: isLoadingScores } = useMongoFacultyKeywordScores(
    { keyword: keywordStatsQuery, limit: 8 },
    { query: { enabled: !!keywordStatsQuery } }
  );

  const { data: yearActivity, isLoading: isLoadingYearActivity } = useMongoYearActivity();
  
  const { data: venueAnalysis, isLoading: isLoadingVenue } = useMongoVenueAnalysis({ limit: 12 });

  const handlePubSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput) setPubSearch(searchInput);
  };

  const handleKeywordSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keywordStatsInput) setKeywordStatsQuery(keywordStatsInput);
  };

  const tooltipStyle = { backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' };

  return (
    <div className="space-y-6 pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3 mb-2">
          <DatabaseZap className="text-emerald-400 w-8 h-8" /> MongoDB Explorer
        </h1>
        <p className="text-muted-foreground">
          NoSQL document stores handle unstructured data elegantly. MongoDB is ideal for full-text searches 
          over abstracts and uses the Aggregation Pipeline to dynamically compute complex statistics across hierarchical JSON documents.
        </p>
      </header>

      {/* Global Year Activity */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <h2 className="text-xl font-display font-semibold flex items-center gap-2">
            <Globe className="text-emerald-400" /> Global Research Activity
          </h2>
          <Badge>$group by year (full collection scan)</Badge>
        </div>
        <div className="h-[250px] w-full">
          {isLoadingYearActivity ? (
            <div className="w-full h-full flex items-center justify-center text-slate-500"><Loader2 className="animate-spin" /></div>
          ) : yearActivity && yearActivity.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yearActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPubs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCites" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
                <YAxis yAxisId="left" stroke="#10b981" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={12} />
                <RechartsTooltip contentStyle={tooltipStyle} />
                <Area yAxisId="left" type="monotone" dataKey="publications" stroke="#10b981" fillOpacity={1} fill="url(#colorPubs)" />
                <Area yAxisId="right" type="monotone" dataKey="totalCitations" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCites)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">No activity data available.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Full Text Search */}
        <div className="lg:col-span-7 space-y-6 flex flex-col">
          <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col h-[700px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-display font-semibold flex items-center gap-2">
                <FileText className="text-emerald-400" /> Publication Search
              </h2>
              <Badge>$regex text search on documents</Badge>
            </div>
            
            <form onSubmit={handlePubSearch} className="relative w-full mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Search titles or abstracts..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </form>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {isLoadingPubs ? (
                <div className="flex justify-center items-center h-full text-slate-500"><Loader2 className="w-8 h-8 animate-spin" /></div>
              ) : pubDetails?.length ? (
                pubDetails.map(pub => (
                  <div key={pub.id} className="bg-white/5 border border-white/5 hover:border-white/10 p-5 rounded-xl transition-all">
                    <h3 className="text-lg font-semibold text-slate-100">{pub.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-2 mb-4">
                      {pub.year && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-medium">{pub.year}</span>}
                      {pub.venue && <span className="text-xs bg-white/10 text-slate-300 px-2 py-0.5 rounded font-medium">{pub.venue}</span>}
                      {pub.numCitations !== undefined && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-medium">{pub.numCitations} Citations</span>}
                    </div>
                    {pub.abstract && (
                      <div className="relative pl-4 border-l-2 border-slate-700">
                        <Quote className="absolute -left-2 -top-1 w-4 h-4 text-slate-600 bg-card" />
                        <p className="text-sm text-slate-400 leading-relaxed font-serif italic">
                          {pub.abstract.length > 300 ? `${pub.abstract.substring(0, 300)}...` : pub.abstract}
                        </p>
                      </div>
                    )}
                    {pub.keywords && pub.keywords.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {pub.keywords.slice(0, 5).map((kw, i) => (
                          <span key={i} className="text-[10px] uppercase tracking-wider bg-black/40 text-slate-400 px-2 py-1 rounded">#{kw}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex justify-center items-center h-full text-slate-500">No documents match your search.</div>
              )}
            </div>
          </div>
          
          {/* Venue Citation Impact */}
          <div className="glass-panel p-6 rounded-2xl h-[400px] flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
               <h2 className="text-xl font-display font-semibold flex items-center gap-2">
                 Venue Citation Impact
               </h2>
               <Badge>$group + $sort + $project (aggregation pipeline)</Badge>
            </div>
            <div className="flex-1 w-full min-h-0">
              {isLoadingVenue ? (
                <div className="w-full h-full flex items-center justify-center text-slate-500"><Loader2 className="animate-spin" /></div>
              ) : venueAnalysis?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={venueAnalysis} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="venue" type="category" stroke="#cbd5e1" fontSize={11} width={120} tick={{fill: '#cbd5e1'}} />
                    <RechartsTooltip cursor={{fill: '#ffffff0a'}} contentStyle={tooltipStyle} />
                    <Bar dataKey="avgCitations" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">No venue data available.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Aggregations & Scores */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="glass-panel p-6 rounded-2xl">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-display font-semibold">Keyword Deep Dive</h2>
                <Badge>$group + $avg + $sum</Badge>
             </div>
             
             <form onSubmit={handleKeywordSearch} className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text"
                  placeholder="Analyze keyword stats (e.g. nlp)"
                  value={keywordStatsInput}
                  onChange={(e) => setKeywordStatsInput(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-20 py-3 text-base font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 transition-all shadow-inner"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-3 py-1 rounded text-sm font-medium transition-colors">
                  Analyze
                </button>
              </form>

              {isLoadingStats ? (
                 <div className="animate-pulse space-y-4">
                   <div className="h-24 bg-white/5 rounded-xl"></div>
                   <div className="flex gap-4"><div className="h-20 flex-1 bg-white/5 rounded-xl"></div><div className="h-20 flex-1 bg-white/5 rounded-xl"></div></div>
                 </div>
              ) : keywordStats ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/5 border border-emerald-500/20 p-5 rounded-xl">
                    <div className="text-emerald-400 text-sm font-medium mb-1 uppercase tracking-wider">Total Impact</div>
                    <div className="text-4xl font-display font-bold text-white">{keywordStats.totalCitations.toLocaleString()}</div>
                    <div className="text-sm text-slate-400 mt-1">Citations across {keywordStats.totalPublications} publications</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                      <div className="text-slate-400 text-xs font-medium mb-1 uppercase tracking-wider">Avg. Citations</div>
                      <div className="text-2xl font-bold text-slate-100">{keywordStats.avgCitations.toFixed(1)}</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                      <div className="text-slate-400 text-xs font-medium mb-1 uppercase tracking-wider">Top Venue</div>
                      <div className="text-lg font-bold text-slate-100 truncate" title={keywordStats.topVenue}>{keywordStats.topVenue || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">No stats found for "{keywordStatsQuery}"</div>
              )}
          </div>

          <div className="glass-panel p-6 rounded-2xl h-[450px] flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-display font-semibold flex items-center gap-2">
                <BarChart3 className="text-emerald-400" /> Faculty Expertise Rank
              </h2>
              <div className="mt-1"><Badge>$unwind + $match + $sort</Badge></div>
            </div>
            
            <div className="flex-1 w-full min-h-0">
              {isLoadingScores ? (
                <div className="w-full h-full flex items-center justify-center text-slate-500"><Loader2 className="animate-spin" /></div>
              ) : facultyScores?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={facultyScores} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#cbd5e1" fontSize={12} width={120} tick={{fill: '#cbd5e1'}} />
                    <RechartsTooltip cursor={{fill: '#ffffff0a'}} contentStyle={tooltipStyle} />
                    <Bar dataKey="score" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">No ranking data available.</div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
