"use client";

import { Button } from "@/components/ui/button";
import { EventWithDetails } from "@/lib/types/database";
import { Filter, Globe, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { getUpcomingEvents } from "./data";
import EventCard from "./eventCard";

export default function PublicEvents() {
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filteredEvents, setFilteredEvents] = useState<EventWithDetails[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const fetchEvents = async () => {
    try {
      setError(null);
      const result = await getUpcomingEvents();

      if (result.success && result.data) {
        // Filter for public events only
        const publicEvents = result.data.filter((event) => event.is_public);
        setEvents(publicEvents);
        setFilteredEvents(publicEvents);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Fehler beim Laden der Events");
      console.error("Error fetching public events:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (categoryFilter === "all") {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(
        events.filter((event) => event.category === categoryFilter)
      );
    }
  }, [events, categoryFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
  };

  const handleJoinEvent = async (eventId: string) => {
    // TODO: Implement join event functionality
    console.log("Joining event:", eventId);
  };

  const getUniqueCategories = () => {
    const categories = events
      .map((event) => event.category)
      .filter(Boolean)
      .filter((category, index, arr) => arr.indexOf(category) === index);
    return categories as string[];
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
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
        <Globe className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Keine öffentlichen Events
        </h3>
        <p className="text-gray-500 mb-4">
          Es gibt derzeit keine öffentlichen Events. Sei der Erste und erstelle
          ein Event!
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

  const uniqueCategories = getUniqueCategories();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-sm text-gray-600">
          {filteredEvents.length} von {events.length} öffentlichen{" "}
          {events.length === 1 ? "Event" : "Events"}
        </p>

        <div className="flex gap-2">
          {uniqueCategories.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Alle Kategorien</option>
                {uniqueCategories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}

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
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event) => (
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
