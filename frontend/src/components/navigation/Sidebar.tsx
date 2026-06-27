import { Bell, Car, Home, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ROUTES } from "@/routes/constants";
import { cn } from "@/utils/cn";

const navigationItems = [
  { href: ROUTES.passengerDashboard, label: "Passenger", icon: Home },
  { href: ROUTES.driverDashboard, label: "Driver", icon: Car },
  { href: ROUTES.notifications, label: "Notifications", icon: Bell },
  { href: ROUTES.profile, label: "Profile", icon: UserRound },
];

export function Sidebar() {
  return (
    <aside className="hidden min-h-[calc(100vh-4rem)] w-64 border-r bg-card/70 p-4 backdrop-blur-xl lg:block">
      <nav className="grid gap-1">
        {navigationItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-accent text-accent-foreground",
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
