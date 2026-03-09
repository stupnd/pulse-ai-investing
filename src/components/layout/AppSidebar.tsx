
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Briefcase, MessageSquare, TrendingUp, Newspaper } from "lucide-react";

const navItems = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Holdings", path: "/holdings", icon: Briefcase },
  { title: "News", path: "/news", icon: Newspaper },
  { title: "Chat", path: "/chat", icon: MessageSquare },
];

export function AppSidebar() {
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
      <div className="px-2 py-3 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-muted">Sage v1.0</p>
      </div>
    </aside>
  );
}
