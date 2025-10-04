"use client";

import EventsNav from "@/components/tabs/events/eventsNav";
import FriendsEvents from "@/components/tabs/events/friendsEvents";
import { Suspense } from "react";

function EventsPageSkeleton() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="h-8 bg-gray-600 rounded animate-pulse w-32"></div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 bg-gray-500 rounded-lg animate-pulse"
          ></div>
        ))}
      </div>
    </div>
  );
}

export default function FriendsEventsPage() {
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <EventsNav />

      <Suspense fallback={<EventsPageSkeleton />}>
        <FriendsEvents />
      </Suspense>
    </div>
  );
}
