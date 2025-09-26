"use client";

import {
  CalendarIcon,
  MapIcon,
  MapPinIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { key: "map", label: "Map", icon: MapIcon, path: "/map" },
    { key: "events", label: "Events", icon: CalendarIcon, path: "/events" },
    {
      key: "add-activity",
      label: "Add",
      icon: MapPinIcon,
      path: "/map/addActivity",
      special: true,
    },
    { key: "friends", label: "Friends", icon: UsersIcon, path: "/friends" },
    { key: "profile", label: "Profile", icon: UserIcon, path: "/profile" },
  ];

  const getActiveTab = () => {
    if (pathname.includes("/map")) return "map";
    if (pathname.includes("/events")) return "events";
    if (pathname.includes("/friends")) return "friends";
    if (pathname.includes("/profile")) return "profile";
    return "map";
  };

  const activeTab = getActiveTab();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-50">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex items-center justify-around h-16 px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            const isSpecial = tab.special;

            return (
              <button
                key={tab.key}
                onClick={() => router.push(tab.path)}
                className={`flex flex-col items-center justify-center relative transition-colors duration-200 ${
                  isSpecial ? "transform -translate-y-2" : ""
                } ${
                  isActive && !isSpecial
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isSpecial ? (
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg mb-1">
                    <Icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                ) : (
                  <Icon className="w-6 h-6 mb-1" />
                )}
                <span
                  className={`text-xs ${isSpecial ? "absolute -bottom-3" : ""}`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
