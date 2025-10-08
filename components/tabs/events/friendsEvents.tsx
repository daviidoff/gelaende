import { createClient } from "@/lib/supabase/server";
import { UserPlus } from "lucide-react";
import { getUpcomingFriendsEvents } from "./data";
import EventCardClient from "./eventCardClient";
import RefreshButton from "./refreshButton";

export default async function FriendsEvents() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await getUpcomingFriendsEvents();

  if (!result.success || !result.data) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{result.message}</p>
        <RefreshButton />
      </div>
    );
  }

  const events = result.data;

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <UserPlus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Keine Events von Freunden
        </h3>
        <p className="text-gray-500 mb-4">
          Deine Freunde haben noch keine Events organisiert oder du hast noch
          keine Freunde hinzugefügt.
        </p>
        <div className="flex gap-2 justify-center">
          <RefreshButton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {events.length} {events.length === 1 ? "Event" : "Events"} von deinen
          Freunden
        </p>
        <RefreshButton />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCardClient
            key={event.id}
            event={event}
            currentUserId={user?.id}
          />
        ))}
      </div>
    </div>
  );
}
