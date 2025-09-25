"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Loader2 } from "lucide-react";

export interface PlaceCardData {
  place_id: string;
  name: string;
  address?: string;
  time?: string; // For recent places
}

export interface PlaceCardProps {
  place: PlaceCardData;
  onClick: (placeId: string) => void;
  isLoading?: boolean;
  isSelected?: boolean;
  fadeIntensity?: number;
}

export function PlaceCard({
  place,
  onClick,
  isLoading,
  isSelected,
  fadeIntensity = 0,
}: PlaceCardProps) {
  // Calculate the colorful gradient based on fade intensity (0-1, where 1 is most colorful)
  const getSelectedStyle = (): React.CSSProperties => {
    if (!isSelected) return {};

    // Create a vibrant gradient that fades exponentially
    const intensity = fadeIntensity;
    const alpha = Math.max(0.1, intensity); // Keep minimum visibility

    return {
      background: `linear-gradient(135deg, 
        rgba(59, 130, 246, ${alpha * 0.8}) 0%, 
        rgba(147, 51, 234, ${alpha * 0.6}) 25%, 
        rgba(236, 72, 153, ${alpha * 0.7}) 50%, 
        rgba(245, 101, 101, ${alpha * 0.5}) 75%, 
        rgba(251, 191, 36, ${alpha * 0.6}) 100%)`,
      boxShadow: `0 0 ${20 * intensity}px rgba(59, 130, 246, ${
        intensity * 0.4
      }), 
                  0 0 ${40 * intensity}px rgba(147, 51, 234, ${
        intensity * 0.2
      })`,
      border: `2px solid rgba(59, 130, 246, ${intensity * 0.8})`,
      transform: `scale(${1 + intensity * 0.02})`,
      transition: "all 0.3s ease-out",
    };
  };

  const selectedStyle = getSelectedStyle();

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-all duration-300 ${
        isSelected ? "ring-2 ring-blue-400 ring-opacity-50" : ""
      }`}
      style={selectedStyle}
      onClick={() => onClick(place.place_id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <MapPin
            className={`w-5 h-5 mt-1 flex-shrink-0 transition-colors duration-300 ${
              isSelected ? "text-white" : "text-primary"
            }`}
          />
          <div className="flex-1 min-w-0">
            <h3
              className={`font-semibold text-sm leading-tight transition-colors duration-300 ${
                isSelected ? "text-white" : ""
              }`}
            >
              {place.name}
            </h3>
            {place.address && (
              <p
                className={`text-xs mt-1 line-clamp-2 transition-colors duration-300 ${
                  isSelected ? "text-gray-100" : "text-muted-foreground"
                }`}
              >
                {place.address}
              </p>
            )}
            {place.time && (
              <p
                className={`text-xs mt-1 transition-colors duration-300 ${
                  isSelected ? "text-gray-200" : "text-muted-foreground"
                }`}
              >
                Last visit: {new Date(place.time).toLocaleDateString()}
              </p>
            )}
          </div>
          {isLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Default export for convenience
export default PlaceCard;
