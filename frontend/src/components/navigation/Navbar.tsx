import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/app/providers/ThemeProvider";
import { useAuth } from "@/features/auth/AuthProvider";
import { ROUTES } from "@/routes/constants";

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { setTheme, theme } = useTheme();
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  function handleSignOut() {
    signOut();
    navigate(ROUTES.login, { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <Button
            aria-label="Open navigation"
            className="lg:hidden"
            size="icon"
            variant="ghost"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-sm font-semibold">Adaptive AI Ride Pooling</p>
            <p className="text-xs text-muted-foreground">Dashboard Foundation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {session ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">{session.user.name}</p>
                <p className="text-xs capitalize text-muted-foreground">{session.user.role}</p>
              </div>
              <Button aria-label="Sign out" size="icon" variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : null}
          <Button
            aria-label="Toggle theme"
            size="icon"
            variant="outline"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
