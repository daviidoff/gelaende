"use client";

import { EventWithDetails } from "@/lib/types/database";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { attendEvent, unattendEvent } from "./actions";
import EventCard from "./eventCard";

interface EventCardClientProps {
  event: EventWithDetails;
  currentUserId?: string;
}

export default function EventCardClient({
  event,
  currentUserId,
}: EventCardClientProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleJoinEvent = async (eventId: string) => {
    try {
      const result = await attendEvent(eventId);
      if (result.success) {
        // Refresh to show updated attendance status
        router.refresh();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Fehler beim Teilnehmen am Event");
      console.error("Error joining event:", err);
    }
  };

  const handleUnattendEvent = async (eventId: string) => {
    try {
      const result = await unattendEvent(eventId);
      if (result.success) {
        // Refresh to show updated attendance status
        router.refresh();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Fehler beim Entfernen der Teilnahme");
      console.error("Error unattending event:", err);
    }
  };

  return (
    <>
      {error && (
        <div className="col-span-full text-red-500 text-sm text-center">
          {error}
        </div>
      )}
      <EventCard
        event={event}
        onJoin={handleJoinEvent}
        onUnattend={handleUnattendEvent}
        showJoinButton={true}
        currentUserId={currentUserId}
      />
    </>
  );
}
