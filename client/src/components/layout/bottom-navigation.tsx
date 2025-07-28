import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  ChartPie, 
  Briefcase, 
  ArrowLeftRight, 
  Coins, 
  Wallet 
} from "lucide-react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: ChartPie },
  { path: "/holdings", label: "Holdings", icon: Briefcase },
  { path: "/transactions", label: "Trades", icon: ArrowLeftRight },
  { path: "/dividends", label: "Dividends", icon: Coins },
  { path: "/cash", label: "Cash", icon: Wallet },
];

export function BottomNavigation() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location === path;
          return (
            <Link key={path} href={path}>
              <div
                className={cn(
                  "flex flex-col items-center py-2 px-1 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Icon className="text-lg mb-1 h-5 w-5" />
                <span className="text-xs font-medium">{label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
