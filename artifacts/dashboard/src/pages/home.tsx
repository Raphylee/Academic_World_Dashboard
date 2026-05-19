import { useState } from "react";
import {
  useMysqlStats,
  useMysqlPublicationsByYear,
  useMysqlTopKeywords,
  useMysqlFacultySearch,
  useMysqlFacultyPublications,
  useMysqlKeywordTrend,
  useMysqlFacultyHindex,
  useMysqlKeywordCooccurrence,
  useMysqlUniversityProfile,
  useMysqlGetFavoriteKeywords,
  useMysqlAddFavoriteKeyword,
  useMysqlDeleteFavoriteKeyword,
  useMongoPublicationDetails,
  useMongoKeywordStats,
  useMongoFacultyKeywordScores,
  useMongoVenueAnalysis,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid, LineChart, Line,
} from "recharts";
import {
  Users, BookOpen, Tag, Award, Search, Loader2, TrendingUp,
  Star, Trash2, Database, FileText, BarChart3, Quote,
  Building2, Cpu, BookMarked, PlusCircle,
} from "lucide-react";

const TOOLTIP_STYLE = {
  backgroundColor: "#0a0f1e",
  borderColor: "rgba(255,255,255,0.08)",
  borderRadius: "10px",
  color: "#e2e8f0",
  fontSize: "12px",
};

function SqlBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-mono bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
      {children}
    </span>
  );
}
function MongoBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
      {children}
    </span>
  );
}

function CardHeader({
  icon: Icon,
  title,
  badge,
  iconColor = "text-blue-400",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badge: React.ReactNode;
  iconColor?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2 mb-5">
      <h2 className="text-base font-display font-semibold text-slate-100 flex items-center gap-2">
        <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
        {title}
      </h2>
      {badge}
    </div>
  );
}

function DarkInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className = "",
  mongo = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder: string;
  className?: string;
  mongo?: boolean;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
      <input
        className={`dark-input ${mongo ? "mongo-input" : ""} w-full pl-9 pr-3 py-2 text-sm rounded-xl ${className}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}

function SearchBtn({
  onClick,
  loading,
  mongo = false,
  label = "Search",
}: {
  onClick: () => void;
  loading?: boolean;
  mongo?: boolean;
  label?: string;
}) {
  const cls = mongo
    ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
    : "bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30";
  return (
    <button
      onClick={onClick}
      className={`${cls} px-4 py-2 text-sm font-medium rounded-xl transition flex items-center gap-1.5 shrink-0`}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}

function Skeleton({ rows = 4, h = "h-8" }: { rows?: number; h?: string }) {
  return (
    <div className="space-y-2">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className={`${h} rounded-xl bg-white/5 animate-pulse`} />
      ))}
    </div>
  );
}

function Spinner({ color = "text-blue-400" }: { color?: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <Loader2 className={`w-7 h-7 animate-spin ${color}`} />
    </div>
  );
}

// ─── Widget 1: Summary Stats ───────────────────────────────────────────────
function SummaryStats() {
  const { data: stats, isLoading } = useMysqlStats();
  const cards = [
    { label: "Faculty Members", value: stats?.facultyCount, icon: Users, sub: "across all universities" },
    { label: "Publications", value: stats?.publicationCount, icon: BookOpen, sub: "indexed in the system" },
    { label: "Unique Keywords", value: stats?.keywordCount, icon: Tag, sub: "research topics tracked" },
    { label: "Total Citations", value: stats?.totalCitations, icon: Award, sub: "cumulative impact" },
  ];
  return (
    <>
      {cards.map((c) => (
        <div
          key={c.label}
          className="glass-panel rounded-2xl p-5 flex flex-col gap-3 hover:border-white/15 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <c.icon className="w-5 h-5 text-primary" />
          </div>
          {isLoading ? (
            <div className="h-9 w-28 bg-white/5 rounded-lg animate-pulse" />
          ) : (
            <p className="text-3xl font-display font-bold text-white">
              {(c.value ?? 0).toLocaleString()}
            </p>
          )}
          <div>
            <p className="text-sm font-medium text-slate-300">{c.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{c.sub}</p>
          </div>
        </div>
      ))}
    </>
  );
}

// ─── Widget 2: Publication Trend ────────────────────────────────────────────
function PublicationTrend() {
  const [kwInput, setKwInput] = useState("machine learning");
  const [kwQuery, setKwQuery] = useState("machine learning");
  const { data: allPubs, isLoading: isLoadingAll } = useMysqlPublicationsByYear();
  const { data: trendData, isLoading: isLoadingTrend } = useMysqlKeywordTrend(
    { keyword: kwQuery },
    { query: { enabled: kwQuery.length > 0 } }
  );

  const chartData = kwQuery
    ? trendData ?? []
    : (allPubs ?? []).slice(-20);

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col h-full min-h-[320px]">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h2 className="text-base font-display font-semibold text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400 shrink-0" />
          Publication Trend
        </h2>
        <SqlBadge>MySQL · GROUP BY year</SqlBadge>
      </div>
      <div className="flex gap-2 mb-4">
        <DarkInput
          value={kwInput}
          onChange={setKwInput}
          onKeyDown={(e) => e.key === "Enter" && setKwQuery(kwInput)}
          placeholder="Filter by keyword (e.g. machine learning)…"
        />
        <SearchBtn onClick={() => setKwQuery(kwInput)} loading={isLoadingTrend} />
      </div>
      <div className="flex-1 min-h-0">
        {isLoadingAll || isLoadingTrend ? (
          <Spinner />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="year" stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} width={32} />
              <RechartsTooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "rgba(255,255,255,0.08)" }} />
              <Line type="monotone" dataKey="count" stroke="hsl(238 100% 70%)" strokeWidth={2.5} dot={false} name="Publications" activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            No data for "{kwQuery}"
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Widget 3: Top Keywords ─────────────────────────────────────────────────
function TopKeywords() {
  const { data, isLoading } = useMysqlTopKeywords({ limit: 12 });
  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col h-full min-h-[320px]">
      <CardHeader icon={Tag} title="Top Keywords" badge={<SqlBadge>MySQL · JOIN + COUNT</SqlBadge>} />
      {isLoading ? (
        <Skeleton rows={10} h="h-6" />
      ) : (
        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
          {data?.map((kw, i) => {
            const max = data[0]?.count ?? 1;
            const pct = Math.round((kw.count / max) * 100);
            return (
              <div key={kw.keyword} className="group">
                <div className="flex items-center justify-between text-xs mb-0.5">
                  <span className="text-slate-300 group-hover:text-white transition-colors">
                    <span className="text-slate-600 mr-1.5">{i + 1}.</span>
                    {kw.keyword.charAt(0).toUpperCase() + kw.keyword.slice(1)}
                  </span>
                  <span className="text-slate-400 font-mono">{kw.count.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent opacity-70"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Widget 4: Faculty H-Index Leaderboard ──────────────────────────────────
function HIndexLeaderboard() {
  const { data, isLoading } = useMysqlFacultyHindex({ limit: 10 });
  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col h-full min-h-[320px]">
      <CardHeader
        icon={Award}
        title="Faculty H-Index Leaderboard"
        badge={<SqlBadge>MySQL · ROW_NUMBER() + CTE</SqlBadge>}
      />
      {isLoading ? (
        <Skeleton rows={8} h="h-7" />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th className="text-left py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">University</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider">H</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Pubs</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Cites</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((f, i) => (
                <tr key={f.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="py-2.5 px-2 font-medium text-slate-200">
                    <span className="text-slate-600 mr-1.5 text-xs">{i + 1}.</span>
                    {f.name}
                  </td>
                  <td className="py-2.5 px-2 text-slate-400 text-xs hidden sm:table-cell truncate max-w-[120px]">
                    {f.university || "—"}
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold text-primary">{f.hIndex}</td>
                  <td className="py-2.5 px-2 text-right text-slate-300">{f.totalPublications}</td>
                  <td className="py-2.5 px-2 text-right text-slate-300">{f.totalCitations?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Widget 5: Keyword Co-occurrence ────────────────────────────────────────
function KeywordCooccurrence() {
  const [input, setInput] = useState("machine learning");
  const [query, setQuery] = useState("machine learning");
  const { data, isLoading } = useMysqlKeywordCooccurrence(
    { keyword: query, limit: 8 },
    { query: { enabled: query.length > 0 } }
  );
  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col h-full min-h-[320px]">
      <CardHeader
        icon={Cpu}
        title="Keyword Co-occurrence"
        badge={<SqlBadge>MySQL · Self-Join pk1 ⟷ pk2</SqlBadge>}
      />
      <div className="flex gap-2 mb-4">
        <DarkInput
          value={input}
          onChange={setInput}
          onKeyDown={(e) => e.key === "Enter" && setQuery(input)}
          placeholder="Enter keyword…"
        />
        <SearchBtn onClick={() => setQuery(input)} loading={isLoading} />
      </div>
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <Spinner />
        ) : data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="keyword" type="category" stroke="#64748b" fontSize={11} width={110} tick={{ fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <RechartsTooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="cooccurrences" fill="hsl(190 90% 50%)" radius={[0, 4, 4, 0]} barSize={14} name="Co-occurrences" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            No co-occurrence data for "{query}"
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Widget 6: University Profile ───────────────────────────────────────────
function UniversityProfile() {
  const { data, isLoading } = useMysqlUniversityProfile({ limit: 10 });
  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col h-full min-h-[320px]">
      <CardHeader
        icon={Building2}
        title="University Research Profile"
        badge={<SqlBadge>MySQL · Multi-level Aggregation</SqlBadge>}
      />
      {isLoading ? (
        <Skeleton rows={6} h="h-14" />
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {data?.map((uni) => (
            <div
              key={uni.university}
              className="bg-white/3 border border-white/6 hover:border-white/12 p-3 rounded-xl transition-colors"
            >
              <div className="font-semibold text-slate-200 text-sm mb-1.5 truncate">{uni.university}</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-slate-400">
                <span>Faculty: <span className="text-slate-200">{uni.facultyCount}</span></span>
                <span>Avg cites: <span className="text-primary font-medium">{uni.avgCitations.toFixed(1)}</span></span>
                <span>Keywords: <span className="text-slate-200">{uni.keywordDiversity}</span></span>
                <span className="truncate">Top: <span className="text-accent">{uni.topKeyword || "—"}</span></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Widget 7: Faculty Search ────────────────────────────────────────────────
function FacultySearch() {
  const [input, setInput] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: facultyResults, isLoading: isSearching } = useMysqlFacultySearch(
    { q: input, limit: 6 },
    { query: { enabled: input.length > 2 } }
  );
  const { data: pubs, isLoading: isLoadingPubs } = useMysqlFacultyPublications(
    { facultyId: selectedId! },
    { query: { enabled: selectedId != null } }
  );

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col h-full min-h-[380px]">
      <CardHeader
        icon={Users}
        title="Faculty Search"
        badge={<SqlBadge>MySQL · LIKE Query</SqlBadge>}
      />
      <div className="mb-3">
        <DarkInput
          value={input}
          onChange={(v) => { setInput(v); setSelectedId(null); }}
          placeholder="Search faculty by name (3+ chars)…"
        />
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0 mb-3">
        {isSearching ? (
          <Skeleton rows={3} h="h-10" />
        ) : facultyResults?.length ? (
          facultyResults.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedId(f.id)}
              className={`w-full text-left p-2.5 rounded-xl border transition-all text-sm ${
                selectedId === f.id
                  ? "bg-primary/15 border-primary/40 text-white"
                  : "bg-white/3 border-white/6 text-slate-300 hover:bg-white/6 hover:border-white/12"
              }`}
            >
              <div className="font-semibold">{f.name}</div>
              <div className="text-xs opacity-60 mt-0.5">{f.university || "Unknown"}</div>
            </button>
          ))
        ) : input.length > 2 ? (
          <p className="text-center text-slate-500 text-sm py-4">No faculty found.</p>
        ) : (
          <p className="text-center text-slate-600 text-xs py-4">Type 3+ characters to search</p>
        )}
      </div>

      {/* Publications sub-panel */}
      {selectedId != null && (
        <div className="border-t border-white/8 pt-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <BookOpen className="w-3 h-3" /> Publications
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {isLoadingPubs ? (
              <Skeleton rows={2} h="h-10" />
            ) : pubs?.length ? (
              pubs.slice(0, 5).map((p) => (
                <div key={p.id} className="bg-black/20 p-2.5 rounded-lg border border-white/5">
                  <div className="text-xs font-medium text-slate-200 line-clamp-2 leading-snug">{p.title}</div>
                  <div className="flex gap-3 text-[10px] text-slate-500 mt-1">
                    <span>{p.year}</span>
                    <span className="flex items-center gap-0.5 text-amber-400">
                      <Star className="w-2.5 h-2.5" fill="currentColor" /> {p.numCitations}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-600 text-xs text-center py-2">No publications found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Widget 8: MongoDB Publication Search ───────────────────────────────────
function MongoPublicationSearch() {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("neural");
  const [query, setQuery] = useState("neural");

  const { data, isLoading } = useMongoPublicationDetails(
    { q: query, limit: 8 },
    { query: { enabled: query.length > 0 } }
  );

  const addFavorite = useMysqlAddFavoriteKeyword({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/mysql/favorite-keywords"] }),
    },
  });

  const handleSave = (keyword: string) => {
    if (keyword) addFavorite.mutate({ data: { keyword } });
  };

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col h-full min-h-[420px]">
      <CardHeader
        icon={FileText}
        title="Publication Search"
        badge={<MongoBadge>MongoDB · $regex text search</MongoBadge>}
        iconColor="text-emerald-400"
      />
      <div className="flex gap-2 mb-4">
        <DarkInput
          value={input}
          onChange={setInput}
          onKeyDown={(e) => e.key === "Enter" && setQuery(input)}
          placeholder="Search titles or abstracts…"
          mongo
        />
        <SearchBtn onClick={() => setQuery(input)} loading={isLoading} mongo label="Search" />
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
        {isLoading ? (
          <Skeleton rows={3} h="h-24" />
        ) : data?.length ? (
          data.map((pub) => (
            <div
              key={String(pub.id)}
              className="bg-white/3 border border-white/6 hover:border-emerald-500/20 p-4 rounded-xl transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-100 line-clamp-2 leading-snug flex-1">{pub.title}</h3>
                {pub.keywords && pub.keywords.length > 0 && (
                  <button
                    onClick={() => handleSave(pub.keywords![0])}
                    disabled={addFavorite.isPending}
                    title={`Save keyword "${pub.keywords![0]}" to favorites`}
                    className="shrink-0 flex items-center gap-1 text-[10px] font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <PlusCircle className="w-3 h-3" />
                    Save
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {pub.year && (
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-medium">{pub.year}</span>
                )}
                {pub.numCitations != null && (
                  <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full font-medium">{pub.numCitations.toLocaleString()} cites</span>
                )}
                {pub.venue && (
                  <span className="text-[10px] bg-white/6 text-slate-400 px-2 py-0.5 rounded-full">{pub.venue.length > 30 ? pub.venue.slice(0, 30) + "…" : pub.venue}</span>
                )}
              </div>
              {pub.abstract && (
                <div className="mt-2 pl-3 border-l-2 border-white/8">
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 italic">
                    {pub.abstract.length > 200 ? pub.abstract.slice(0, 200) + "…" : pub.abstract}
                  </p>
                </div>
              )}
              {pub.keywords && pub.keywords.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {pub.keywords.slice(0, 4).map((kw, i) => (
                    <span key={i} className="text-[9px] uppercase tracking-wider bg-black/30 text-slate-500 px-1.5 py-0.5 rounded">#{kw}</span>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            No documents match "{query}"
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Widget 9: Venue Citation Impact ────────────────────────────────────────
function VenueCitationImpact() {
  const { data, isLoading } = useMongoVenueAnalysis({ limit: 10 });
  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col h-full min-h-[320px]">
      <CardHeader
        icon={BarChart3}
        title="Venue Citation Impact"
        badge={<MongoBadge>MongoDB · $group + $sort pipeline</MongoBadge>}
        iconColor="text-emerald-400"
      />
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <Spinner color="text-emerald-400" />
        ) : data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="venue"
                type="category"
                stroke="#64748b"
                fontSize={10}
                width={115}
                tick={{ fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + "…" : v}
              />
              <RechartsTooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.03)" }} formatter={(v: number) => [Math.round(v).toLocaleString(), "Avg Citations"]} />
              <Bar dataKey="avgCitations" fill="#10b981" radius={[0, 4, 4, 0]} barSize={14} name="Avg Citations" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">No venue data available.</div>
        )}
      </div>
    </div>
  );
}

// ─── Widget 10: Keyword Deep Dive ───────────────────────────────────────────
function KeywordDeepDive() {
  const [input, setInput] = useState("nlp");
  const [query, setQuery] = useState("nlp");

  const { data: stats, isLoading: isLoadingStats } = useMongoKeywordStats(
    { keyword: query },
    { query: { enabled: query.length > 0 } }
  );
  const { data: faculty, isLoading: isLoadingFaculty } = useMongoFacultyKeywordScores(
    { keyword: query, limit: 6 },
    { query: { enabled: query.length > 0 } }
  );

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col h-full min-h-[320px]">
      <CardHeader
        icon={Database}
        title="Keyword Deep Dive"
        badge={<MongoBadge>MongoDB · $group + $avg + $sum</MongoBadge>}
        iconColor="text-emerald-400"
      />
      <div className="flex gap-2 mb-4">
        <DarkInput
          value={input}
          onChange={setInput}
          onKeyDown={(e) => e.key === "Enter" && setQuery(input)}
          placeholder="Analyze a keyword (e.g. nlp)…"
          mongo
        />
        <SearchBtn onClick={() => setQuery(input)} loading={isLoadingStats} mongo label="Analyze" />
      </div>

      {isLoadingStats ? (
        <Skeleton rows={3} h="h-10" />
      ) : stats ? (
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-emerald-500/15 to-teal-500/5 border border-emerald-500/20 p-4 rounded-xl">
            <div className="text-emerald-400 text-[10px] font-medium uppercase tracking-wider mb-1">Total Citations</div>
            <div className="text-3xl font-display font-bold text-white">{stats.totalCitations.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-1">across {stats.totalPublications} publications</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/3 border border-white/8 p-3 rounded-xl">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Avg Citations</div>
              <div className="text-xl font-bold text-slate-100">{stats.avgCitations.toFixed(1)}</div>
            </div>
            <div className="bg-white/3 border border-white/8 p-3 rounded-xl">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Top Venue</div>
              <div className="text-xs font-bold text-slate-100 leading-tight">{stats.topVenue || "—"}</div>
            </div>
          </div>
        </div>
      ) : query.length > 0 ? (
        <p className="text-center text-slate-500 text-sm py-4">No stats found for "{query}"</p>
      ) : null}

      {/* Faculty expertise chart */}
      {(faculty && faculty.length > 0) && (
        <div className="flex-1 min-h-[140px] mt-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Top Faculty by Expertise Score</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={faculty} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={90} tick={{ fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v: string) => v.length > 12 ? v.slice(0, 12) + "…" : v} />
              <RechartsTooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="score" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} name="Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── Widget 11: Saved Keywords ──────────────────────────────────────────────
function SavedKeywords() {
  const queryClient = useQueryClient();
  const [newKw, setNewKw] = useState("");
  const { data: favorites, isLoading } = useMysqlGetFavoriteKeywords();

  const addFavorite = useMysqlAddFavoriteKeyword({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/mysql/favorite-keywords"] });
        setNewKw("");
      },
    },
  });
  const deleteFavorite = useMysqlDeleteFavoriteKeyword({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/mysql/favorite-keywords"] }),
    },
  });

  const handleAdd = () => {
    if (newKw.trim()) addFavorite.mutate({ data: { keyword: newKw.trim() } });
  };

  return (
    <div className="glass-panel rounded-2xl p-5">
      <CardHeader
        icon={Star}
        title="Saved Keywords"
        badge={<SqlBadge>MySQL · INSERT / DELETE</SqlBadge>}
      />

      {/* Add keyword input */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <BookMarked className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            className="dark-input w-full pl-9 pr-3 py-2.5 text-sm rounded-xl font-medium"
            placeholder="Add a keyword to save…"
            value={newKw}
            onChange={(e) => setNewKw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!newKw.trim() || addFavorite.isPending}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-40 shrink-0"
        >
          {addFavorite.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
          Add Keyword
        </button>
      </div>

      {/* Keyword chips */}
      {isLoading ? (
        <Skeleton rows={1} h="h-10" />
      ) : favorites && favorites.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {favorites.map((fav) => (
            <div
              key={fav.id}
              className="group flex items-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-full transition-colors"
            >
              <Star className="w-3 h-3 text-amber-400" fill="currentColor" />
              <span className="text-sm font-medium text-slate-200">{fav.keyword}</span>
              <button
                onClick={() => deleteFavorite.mutate({ id: fav.id })}
                disabled={deleteFavorite.isPending}
                className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ml-0.5"
                title="Remove"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-slate-600 text-sm py-4 border border-dashed border-white/8 rounded-xl">
          No saved keywords yet. Add one above or click <span className="text-emerald-400 font-medium">Save</span> on any publication.
        </div>
      )}
    </div>
  );
}

// ─── Main Home Page ─────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="pb-16">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-primary to-accent" />
          <h1 className="text-2xl font-display font-bold text-white leading-tight">
            Academic World Data Intelligence Dashboard
          </h1>
        </div>
        <p className="text-slate-500 text-sm ml-4.5 pl-3 border-l border-white/8">
          Unified view across MySQL (relational) and MongoDB (document) databases — live queries, no mocked data
        </p>
      </div>

      {/* ── ROW 1: Summary Stats (4 cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <SummaryStats />
      </div>

      {/* ── ROW 2: Publication Trend (wide) + Venue Citation Impact ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2"><PublicationTrend /></div>
        <div className="lg:col-span-1"><VenueCitationImpact /></div>
      </div>

      {/* ── ROW 3: Top Keywords + H-Index Leaderboard ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <TopKeywords />
        <HIndexLeaderboard />
      </div>

      {/* ── ROW 4: Keyword Co-occurrence + Faculty Search ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <KeywordCooccurrence />
        <FacultySearch />
      </div>

      {/* ── ROW 5: MongoDB Publication Search + Keyword Deep Dive ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2"><MongoPublicationSearch /></div>
        <div className="lg:col-span-1"><KeywordDeepDive /></div>
      </div>

      {/* ── ROW 6: University Profile (full width) ── */}
      <div className="mb-4">
        <UniversityProfile />
      </div>

      {/* ── ROW 7: Saved Keywords (full width) ── */}
      <SavedKeywords />
    </div>
  );
}
