"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  GlobeIcon,
  PlusIcon,
  Settings,
  UsersIcon,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface EventsNavProps {
  className?: string;
}

export default function EventsNav({ className }: EventsNavProps) {
  const pathname = usePathname();
  const router = useRouter();

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Events</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-2">
              <PlusIcon className="h-4 w-4" />
              Event erstellen
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push("/events/simple-add")}>
              <Zap className="mr-2 h-4 w-4" />
              <div>
                <div className="font-medium">Quick Event</div>
                <div className="text-xs text-muted-foreground">
                  Schnell und einfach
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/events/add")}>
              <Settings className="mr-2 h-4 w-4" />
              <div>
                <div className="font-medium">Erweitert</div>
                <div className="text-xs text-muted-foreground">
                  Alle Optionen
                </div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
