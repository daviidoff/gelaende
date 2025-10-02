"use client";

import { Button } from "@/components/ui/button";
import { EventWithDetails } from "@/lib/types/database";
import { RefreshCw, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { getUpcomingFriendsEvents } from "./data";
import EventCard from "./eventCard";

export default function FriendsEvents() {
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = async () => {
    try {
      setError(null);
      const result = await getUpcomingFriendsEvents();

      if (result.success && result.data) {
        setEvents(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Fehler beim Laden der Events");
      console.error("Error fetching friends events:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
  };

  const handleJoinEvent = async (eventId: string) => {
    // TODO: Implement join event functionality
    console.log("Joining event:", eventId);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 bg-gray-100 rounded-lg animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Erneut versuchen
        </Button>
      </div>
    );
  }

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
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Aktualisieren
          </Button>
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
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={refreshing}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Aktualisieren
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onJoin={handleJoinEvent}
            showJoinButton={true}
          />
        ))}
      </div>
    </div>
  );
}
