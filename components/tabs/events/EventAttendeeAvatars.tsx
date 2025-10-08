import { Profile } from "@/lib/types/database";

interface EventAttendeeAvatarsProps {
  attendees: (Profile & { isFriend?: boolean })[];
  currentUserId: string;
  maxVisible?: number;
}

export default function EventAttendeeAvatars({
  attendees,
  currentUserId,
  maxVisible = 5,
}: EventAttendeeAvatarsProps) {
  // Sort attendees: current user first, then friends, then others
  const sortedAttendees = [...attendees].sort((a, b) => {
    const aIsCurrentUser = a.user_id === currentUserId ? 1 : 0;
    const bIsCurrentUser = b.user_id === currentUserId ? 1 : 0;

    if (aIsCurrentUser !== bIsCurrentUser) {
      return bIsCurrentUser - aIsCurrentUser; // Current user first
    }

    const aIsFriend = a.isFriend ? 1 : 0;
    const bIsFriend = b.isFriend ? 1 : 0;

    if (aIsFriend !== bIsFriend) {
      return bIsFriend - aIsFriend; // Friends second
    }

    return 0; // Keep original order for others
  });

  const visibleAttendees = sortedAttendees.slice(0, maxVisible);
  const remainingCount = sortedAttendees.length - visibleAttendees.length;

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (userId: string) => {
    // Generate a consistent color based on userId
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-orange-500",
      "bg-teal-500",
      "bg-indigo-500",
      "bg-rose-500",
    ];
    const index = userId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  if (attendees.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visibleAttendees.map((attendee) => {
          const isCurrentUser = attendee.user_id === currentUserId;

          return (
            <div
              key={attendee.user_id}
              className={`relative inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-medium text-white ${getAvatarColor(
                attendee.user_id
              )} ${isCurrentUser ? "ring-2 ring-blue-400" : ""}`}
              title={`${attendee.name}${isCurrentUser ? " (Du)" : ""}${
                attendee.isFriend ? " ✓" : ""
              }`}
            >
              {getInitials(attendee.name)}
            </div>
          );
        })}
        {remainingCount > 0 && (
          <div
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-300 text-xs font-medium text-gray-700"
            title={`${remainingCount} weitere${
              remainingCount === 1 ? "r" : ""
            } Teilnehmer`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground">
        {sortedAttendees.length} Teilnehmer
      </span>
    </div>
  );
}
