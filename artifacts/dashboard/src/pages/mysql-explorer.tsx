import { useState } from "react";
import { 
  useMysqlTopKeywords,
  useMysqlFacultySearch,
  useMysqlFacultyPublications,
  useMysqlKeywordTrend,
  useMysqlGetFavoriteKeywords,
  useMysqlAddFavoriteKeyword,
  useMysqlDeleteFavoriteKeyword,
  useMysqlFacultyHindex,
  useMysqlKeywordCooccurrence,
  useMysqlUniversityProfile
} from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Search, Star, Trash2, TrendingUp, User, BookOpen, Loader2, Info } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

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

export default function MySQLExplorer() {
  const queryClient = useQueryClient();
  
  const [facultySearch, setFacultySearch] = useState("");
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
  
  const [trendKeyword, setTrendKeyword] = useState("machine learning");
  const [cooccurrenceKeyword, setCooccurrenceKeyword] = useState("machine learning");
  
  const [newFavorite, setNewFavorite] = useState("");

  const { data: topKeywords, isLoading: isLoadingTopKeywords } = useMysqlTopKeywords({ limit: 10 });
  const { data: facultyResults, isLoading: isSearchingFaculty } = useMysqlFacultySearch(
    { q: facultySearch, limit: 5 },
    { query: { enabled: facultySearch.length > 2 } }
  );
  const { data: facultyPubs, isLoading: isLoadingPubs } = useMysqlFacultyPublications(
    { facultyId: selectedFacultyId! },
    { query: { enabled: !!selectedFacultyId } }
  );
  const { data: trendData, isLoading: isLoadingTrend } = useMysqlKeywordTrend(
    { keyword: trendKeyword },
    { query: { enabled: !!trendKeyword } }
  );
  const { data: favorites } = useMysqlGetFavoriteKeywords();
  
  const { data: hindexData, isLoading: isLoadingHindex } = useMysqlFacultyHindex({ limit: 10 });
  const { data: cooccurrenceData, isLoading: isLoadingCooccurrence } = useMysqlKeywordCooccurrence(
    { keyword: cooccurrenceKeyword, limit: 10 },
    { query: { enabled: !!cooccurrenceKeyword } }
  );
  const { data: universityData, isLoading: isLoadingUniversity } = useMysqlUniversityProfile({ limit: 10 });

  const addFavorite = useMysqlAddFavoriteKeyword({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/mysql/favorite-keywords"] });
        setNewFavorite("");
      }
    }
  });

  const deleteFavorite = useMysqlDeleteFavoriteKeyword({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/mysql/favorite-keywords"] })
    }
  });

  const tooltipStyle = { backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' };

  return (
    <div className="space-y-6 pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">MySQL Explorer</h1>
        <p className="text-muted-foreground">
          Relational databases excel at structured queries, strict schemas, and ACID transactions. 
          MySQL powers complex JOINs across normalized tables and sophisticated analytical window functions to compute metrics like the H-index efficiently.
        </p>
      </header>

      {/* Full Width Top Section */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-display font-semibold flex items-center gap-2">
            <TrendingUp className="text-primary" /> Publication Trend
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Analyze keyword..."
                value={trendKeyword}
                onChange={(e) => setTrendKeyword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <Badge>GROUP BY + WHERE (year filter)</Badge>
          </div>
        </div>
        <div className="h-[250px] w-full">
           {isLoadingTrend ? (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Loader2 className="animate-spin" /></div>
          ) : trendData && trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <RechartsTooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="count" stroke="hsl(190 90% 50%)" strokeWidth={3} dot={{ fill: '#0f172a', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: 'hsl(238 100% 70%)' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">No trend data found for "{trendKeyword}"</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
              <h2 className="text-xl font-display font-semibold flex items-center gap-2">
                Top Keywords
              </h2>
              <Badge>JOIN + GROUP BY + ORDER BY</Badge>
            </div>
            <div className="h-[300px] w-full">
              {isLoadingTopKeywords ? (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Loader2 className="animate-spin" /></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topKeywords} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="keyword" stroke="#94a3b8" fontSize={12} angle={-45} textAnchor="end" />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <RechartsTooltip cursor={{fill: '#ffffff0a'}} contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="url(#colorCount)" radius={[4, 4, 0, 0]} />
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(238 100% 70%)" stopOpacity={1}/>
                        <stop offset="100%" stopColor="hsl(190 90% 50%)" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
              <h2 className="text-xl font-display font-semibold flex items-center gap-2">
                Faculty H-Index Leaderboard
                <Info className="w-4 h-4 text-slate-400 group-hover:text-white cursor-pointer" />
              </h2>
              <Badge tooltip="H-index is the max h such that h papers each have ≥ h citations. Computed using ROW_NUMBER() OVER (PARTITION BY faculty_id ORDER BY citations DESC) inside a WITH clause.">Window Function: ROW_NUMBER() + CTE</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-white/5 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Name</th>
                    <th className="px-4 py-3">University</th>
                    <th className="px-4 py-3 text-right">H-Index</th>
                    <th className="px-4 py-3 text-right">Pubs</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Citations</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingHindex ? (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
                  ) : hindexData?.map((faculty, i) => (
                    <tr key={faculty.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 w-4">{i + 1}.</span>
                          {faculty.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{faculty.university || 'Unknown'}</td>
                      <td className="px-4 py-3 text-right font-bold text-primary">{faculty.hIndex}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{faculty.totalPublications}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{faculty.totalCitations}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-2xl flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <h2 className="text-xl font-display font-semibold">Keyword Co-occurrence</h2>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text"
                    value={cooccurrenceKeyword}
                    onChange={(e) => setCooccurrenceKeyword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-primary transition-all"
                  />
                </div>
                <Badge>Self-Join: pk1 JOIN pk2</Badge>
              </div>
              <div className="flex-1 min-h-[250px]">
                {isLoadingCooccurrence ? (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Loader2 className="animate-spin" /></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cooccurrenceData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={true} vertical={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="keyword" type="category" stroke="#94a3b8" fontSize={11} width={100} tick={{fill: '#94a3b8'}} />
                      <RechartsTooltip cursor={{fill: '#ffffff0a'}} contentStyle={tooltipStyle} />
                      <Bar dataKey="cooccurrences" fill="hsl(190 90% 50%)" radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl overflow-hidden flex flex-col">
               <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <h2 className="text-xl font-display font-semibold">University Profile</h2>
              </div>
              <div className="mb-4">
                <Badge>Multi-level Aggregation + Correlated Subquery</Badge>
              </div>
              <div className="flex-1 overflow-auto pr-2 space-y-3">
                {isLoadingUniversity ? (
                  <div className="py-8 text-center text-slate-500"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
                ) : universityData?.map((uni, i) => (
                  <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <div className="font-semibold text-slate-200 text-sm mb-1">{uni.university}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                      <div>Faculty: <span className="text-slate-200">{uni.facultyCount}</span></div>
                      <div>Avg Citations: <span className="text-primary font-medium">{uni.avgCitations.toFixed(1)}</span></div>
                      <div>Diversity: <span className="text-slate-200">{uni.keywordDiversity} tags</span></div>
                      <div className="truncate" title={uni.topKeyword}>Top: <span className="text-accent">{uni.topKeyword || 'N/A'}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar 1/3 */}
        <div className="space-y-6 lg:col-span-1">
          
          <div className="glass-panel p-6 rounded-2xl flex flex-col h-[600px]">
            <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
              <User className="text-accent" /> Faculty Search
            </h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Search by name..."
                value={facultySearch}
                onChange={(e) => setFacultySearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary transition-all"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 mb-4">
              {isSearchingFaculty ? (
                <div className="py-4 text-center text-slate-500"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
              ) : facultyResults?.length ? (
                facultyResults.map(faculty => (
                  <button
                    key={faculty.id}
                    onClick={() => setSelectedFacultyId(faculty.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedFacultyId === faculty.id 
                        ? 'bg-primary/20 border-primary text-white' 
                        : 'bg-white/5 border-transparent text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-semibold">{faculty.name}</div>
                    <div className="text-xs opacity-70 mt-1">{faculty.university || 'Unknown University'}</div>
                  </button>
                ))
              ) : facultySearch.length > 2 ? (
                <div className="py-8 text-center text-sm text-slate-500">No faculty found.</div>
              ) : (
                <div className="py-8 text-center text-sm text-slate-500">Type at least 3 characters.</div>
              )}
            </div>

            {/* Publications for selected faculty */}
            <div className="h-1/2 flex flex-col border-t border-white/10 pt-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-300">
                <BookOpen className="w-4 h-4" /> Publications
              </h3>
              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {isLoadingPubs ? (
                  <div className="py-4 text-center text-slate-500"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
                ) : !selectedFacultyId ? (
                  <div className="py-8 text-center text-sm text-slate-500">Select a faculty member.</div>
                ) : facultyPubs?.length ? (
                  facultyPubs.map(pub => (
                    <div key={pub.id} className="bg-black/20 p-3 rounded-lg border border-white/5">
                      <div className="text-xs font-medium text-slate-200 mb-2 leading-tight">{pub.title}</div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{pub.year} • {pub.venue || 'N/A'}</span>
                        <span className="flex items-center gap-1 text-amber-400"><Star className="w-3 h-3" /> {pub.numCitations}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm text-slate-500">No publications found.</div>
                )}
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
              <Star className="text-amber-400" fill="currentColor" /> Saved Keywords
            </h2>
            <div className="flex gap-2 mb-4">
              <input 
                type="text"
                placeholder="Add keyword..."
                value={newFavorite}
                onChange={(e) => setNewFavorite(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && newFavorite && addFavorite.mutate({ data: { keyword: newFavorite } })}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary transition-all"
              />
              <button 
                onClick={() => newFavorite && addFavorite.mutate({ data: { keyword: newFavorite } })}
                disabled={!newFavorite || addFavorite.isPending}
                className="bg-primary hover:bg-primary/90 text-white px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
              {favorites?.map(fav => (
                <div key={fav.id} className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg group hover:bg-white/10 transition-colors">
                  <button 
                    onClick={() => setTrendKeyword(fav.keyword)}
                    className="text-sm font-medium text-slate-200 hover:text-primary transition-colors text-left flex-1"
                  >
                    {fav.keyword}
                  </button>
                  <button 
                    onClick={() => deleteFavorite.mutate({ id: fav.id })}
                    disabled={deleteFavorite.isPending}
                    className="text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {favorites?.length === 0 && (
                <div className="text-center text-sm text-slate-500 py-4">No favorites saved yet.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
