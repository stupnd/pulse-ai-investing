import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Briefcase, MessageSquare, TrendingUp, Newspaper, Bookmark, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/contexts/SessionContext";

const navItems = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Holdings", path: "/holdings", icon: Briefcase },
  { title: "News", path: "/news", icon: Newspaper },
  { title: "Chat", path: "/chat", icon: MessageSquare },
  { title: "Watchlist", path: "/watchlist", icon: Bookmark },
];

export function AppSidebar() {
  const { session } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <aside className="w-64 min-h-screen bg-sidebar flex flex-col p-5 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10 px-2">
        <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-sidebar-primary" />
        </div>
        <span className="text-lg font-semibold text-sidebar-primary tracking-tight">Sage</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )
            }
          >
            <item.icon className="w-4 h-4" />
            {item.title}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 pt-3 border-t border-sidebar-border flex flex-col gap-2">
        {session?.user?.email && (
          <p className="text-xs text-sidebar-muted truncate">{session.user.email}</p>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 text-sm font-medium text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 px-1 py-1.5 rounded-lg transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
