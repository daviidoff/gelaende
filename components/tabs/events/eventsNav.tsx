"use client";

import { cn } from "@/lib/utils";
import { CalendarIcon, GlobeIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface EventsNavProps {
  className?: string;
}

export default function EventsNav({ className }: EventsNavProps) {
  const pathname = usePathname();

  const tabs = [
    {
      key: "friends",
      title: "Freunde",
      href: "/events/friends",
      icon: UsersIcon,
    },
    {
      key: "public",
      title: "Öffentlich",
      href: "/events/public",
      icon: GlobeIcon,
    },
  ];

  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-center gap-2 mb-6">
        <CalendarIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Events</h1>
      </div>

      <div className="border-b border-divider">
        <nav className="flex gap-6">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;

            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 px-0 h-12 text-sm font-medium transition-colors relative",
                  "hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  isActive
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
