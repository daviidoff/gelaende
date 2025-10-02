"use client";

import FriendsEvents from "@/components/tabs/events/friendsEvents";
import PublicEvents from "@/components/tabs/events/publicEvents";
import { Tab, Tabs } from "@heroui/react";
import { CalendarIcon, GlobeIcon, UsersIcon } from "lucide-react";
import { Suspense } from "react";

function EventsPageSkeleton() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="h-8 bg-gray-200 rounded animate-pulse w-32"></div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 bg-gray-100 rounded-lg animate-pulse"
          ></div>
        ))}
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex items-center gap-2 mb-6">
        <CalendarIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Events</h1>
      </div>

      <Tabs
        aria-label="Event categories"
        variant="underlined"
        classNames={{
          tabList:
            "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-primary",
        }}
      >
        <Tab
          key="friends"
          title={
            <div className="flex items-center gap-2">
              <UsersIcon className="w-4 h-4" />
              <span>Freunde</span>
            </div>
          }
        >
          <div className="mt-6">
            <Suspense fallback={<EventsPageSkeleton />}>
              <FriendsEvents />
            </Suspense>
          </div>
        </Tab>

        <Tab
          key="public"
          title={
            <div className="flex items-center gap-2">
              <GlobeIcon className="w-4 h-4" />
              <span>Öffentlich</span>
            </div>
          }
        >
          <div className="mt-6">
            <Suspense fallback={<EventsPageSkeleton />}>
              <PublicEvents />
            </Suspense>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
