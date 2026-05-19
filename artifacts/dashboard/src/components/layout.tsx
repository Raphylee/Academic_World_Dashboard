import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Tag,
  GitBranch,
  TrendingUp,
  Share2,
  Heart,
  GraduationCap,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mysql", label: "Faculty", icon: Users },
  { href: "/mongo", label: "Publications", icon: BookOpen },
  { href: "/mysql", label: "Keywords", icon: Tag, secondary: true },
  { href: "/neo4j", label: "Graph View", icon: GitBranch },
  { href: "/mongo", label: "Research Trends", icon: TrendingUp, secondary: true },
  { href: "/neo4j", label: "Collaborations", icon: Share2, secondary: true },
  { href: "/mysql", label: "Favorites", icon: Heart, secondary: true },
];

const primaryItems = navItems.filter((i) => !i.secondary);
const secondaryItems = navItems.filter((i) => i.secondary);

function NavLink({
  item,
  location,
  onClick,
}: {
  item: (typeof navItems)[0];
  location: string;
  onClick?: () => void;
}) {
  const isActive = location === item.href && !item.secondary;
  return (
    <Link href={item.href} onClick={onClick}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer text-sm font-medium",
          isActive
            ? "bg-primary text-white shadow-lg shadow-primary/30"
            : "text-[hsl(var(--sidebar-muted))] hover:bg-white/10 hover:text-[hsl(var(--sidebar-foreground))]"
        )}
      >
        <item.icon className="w-4 h-4 shrink-0" />
        <span>{item.label}</span>
      </div>
    </Link>
  );
}

function SidebarContent({
  location,
  onClose,
}: {
  location: string;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[hsl(var(--sidebar-foreground))] font-display font-bold text-base leading-tight">
              AcademicWorld
            </p>
            <p className="text-[hsl(var(--sidebar-muted))] text-xs">
              Explorer Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-[hsl(var(--sidebar-border))]" />

      {/* Primary Nav */}
      <nav className="flex-1 px-3 pt-4 space-y-0.5 overflow-y-auto">
        {primaryItems.map((item) => (
          <NavLink key={item.label} item={item} location={location} onClick={onClose} />
        ))}

        <div className="pt-4 pb-1 px-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--sidebar-muted))]">
            Explore
          </p>
        </div>

        {secondaryItems.map((item) => (
          <NavLink key={item.label} item={item} location={location} onClick={onClose} />
        ))}
      </nav>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex text-foreground">
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex w-60 flex-col fixed inset-y-0 z-50"
        style={{ background: "hsl(var(--sidebar))" }}
      >
        <SidebarContent location={location} />
      </aside>

      {/* Mobile Header */}
      <div
        className="lg:hidden fixed top-0 inset-x-0 h-14 z-50 flex items-center justify-between px-4 border-b border-[hsl(var(--sidebar-border))]"
        style={{ background: "hsl(var(--sidebar))" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="text-[hsl(var(--sidebar-foreground))] font-display font-bold text-sm">
            AcademicWorld
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 text-[hsl(var(--sidebar-muted))] hover:text-[hsl(var(--sidebar-foreground))]"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="fixed inset-y-0 left-0 w-60 z-50 lg:hidden"
            style={{ background: "hsl(var(--sidebar))" }}
          >
            <SidebarContent location={location} onClose={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:pl-60 pt-14 lg:pt-0 min-h-screen bg-background">
        <div className="p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
