import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Event, EventWithDetails } from "@/lib/types/database";
import { CalendarIcon, ClockIcon, MapPinIcon, UsersIcon } from "lucide-react";

interface EventCardProps {
  event: Event | EventWithDetails;
  onJoin?: (eventId: string) => void;
  onUnattend?: (eventId: string) => void;
  isJoined?: boolean;
  showJoinButton?: boolean;
}

export default function EventCard({
  event,
  onJoin,
  onUnattend,
  isJoined = false,
  showJoinButton = true,
}: EventCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return null;
    return timeString.slice(0, 5); // Format HH:MM
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "draft":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "completed":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      default:
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    }
  };

  const getCategoryColor = (category: string | null) => {
    if (!category) return "bg-gray-100 text-gray-800 hover:bg-gray-200";

    const colors = {
      sport: "bg-orange-100 text-orange-800 hover:bg-orange-200",
      party: "bg-purple-100 text-purple-800 hover:bg-purple-200",
      study: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      outdoor: "bg-green-100 text-green-800 hover:bg-green-200",
      culture: "bg-pink-100 text-pink-800 hover:bg-pink-200",
      food: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    };

    return (
      colors[category as keyof typeof colors] ||
      "bg-gray-100 text-gray-800 hover:bg-gray-200"
    );
  };

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {event.title}
          </CardTitle>
          <div className="flex gap-1 flex-shrink-0">
            <Badge variant="secondary" className={getStatusColor(event.status)}>
              {event.status}
            </Badge>
            {event.category && (
              <Badge
                variant="secondary"
                className={getCategoryColor(event.category)}
              >
                {event.category}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {event.description}
          </p>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarIcon className="h-4 w-4 flex-shrink-0" />
            <span>{formatDate(event.date)}</span>
          </div>

          {(event.start_time || event.end_time) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <ClockIcon className="h-4 w-4 flex-shrink-0" />
              <span>
                {event.start_time && formatTime(event.start_time)}
                {event.start_time && event.end_time && " - "}
                {event.end_time && formatTime(event.end_time)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPinIcon className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">
              {event.place}
              {event.location_details && `, ${event.location_details}`}
            </span>
          </div>

          {event.max_attendees && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <UsersIcon className="h-4 w-4 flex-shrink-0" />
              <span>
                {"attendee_count" in event && event.attendee_count !== undefined
                  ? `${event.attendee_count}/${event.max_attendees} Teilnehmer`
                  : `Max. ${event.max_attendees} Teilnehmer`}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge
            variant="outline"
            className={
              event.is_public
                ? "border-green-200 text-green-700"
                : "border-blue-200 text-blue-700"
            }
          >
            {event.is_public ? "Öffentlich" : "Freunde"}
          </Badge>
          {"creator_profile" in event && event.creator_profile && (
            <span className="text-xs text-muted-foreground">
              von {event.creator_profile.name}
            </span>
          )}
        </div>
      </CardContent>

      {showJoinButton && event.status === "published" && (
        <CardFooter className="pt-3">
          {isJoined || ("is_attending" in event && event.is_attending) ? (
            <div className="w-full flex gap-2">
              <Button variant="secondary" className="flex-1" disabled>
                Teilgenommen
              </Button>
              {onUnattend && (
                <Button
                  onClick={() => onUnattend(event.id)}
                  variant="outline"
                  size="sm"
                  className="px-3"
                >
                  Nicht teilgenommen
                </Button>
              )}
            </div>
          ) : (
            <Button
              onClick={() => onJoin?.(event.id)}
              variant="default"
              className="w-full"
            >
              Teilnehmen
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
