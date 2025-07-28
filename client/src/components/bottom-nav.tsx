import { useLocation } from "wouter";
import { BarChart3, Briefcase, ArrowRightLeft, Coins, Wallet, History } from "lucide-react";

export default function BottomNav() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", icon: BarChart3, label: "Dashboard" },
    { path: "/holdings", icon: Briefcase, label: "Holdings" },
    { path: "/transactions", icon: ArrowRightLeft, label: "Trades" },
    { path: "/dividends", icon: Coins, label: "Dividends" },
    { path: "/history", icon: History, label: "History" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || (item.path === "/" && location === "/dashboard");
          
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center py-2 px-1 transition-colors ${
                isActive ? "text-primary" : "text-gray-500"
              }`}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
