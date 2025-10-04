"use client";

import { getPlacesPaginated } from "@/components/activities/data";
import { createEvent } from "@/components/tabs/events/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { Database } from "@/lib/types/database";
import { EventFormData } from "@/lib/types/database";
import {
  ArrowLeft,
  CalendarIcon,
  ClockIcon,
  Loader2,
  MapPinIcon,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Place = Database["public"]["Tables"]["places"]["Row"];

interface PlaceCardProps {
  place: Place;
  onClick: (placeId: string) => void;
  isSelected: boolean;
}

function PlaceCard({ place, onClick, isSelected }: PlaceCardProps) {
  return (
    <Card
      className={`p-3 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary bg-primary/5" : ""
      }`}
      onClick={() => onClick(place.place_id)}
    >
      <div className="flex items-center gap-3">
        <MapPinIcon className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1">
          <p className="font-medium">{place.name}</p>
        </div>
      </div>
    </Card>
  );
}

export default function SimpleAddEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  // Time in minutes (0-1425, representing 00:00 to 23:45 in 15-min intervals)
  const [timeInMinutes, setTimeInMinutes] = useState(720); // 12:00
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert minutes to HH:MM format
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  // Search places with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        searchPlaces(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const searchPlaces = async (term: string) => {
    setIsSearching(true);
    try {
      const result = await getPlacesPaginated({
        searchTerm: term,
        page: 1,
        limit: 5,
      });

      if (result.success && result.places) {
        setSearchResults(result.places);
      }
    } catch (error) {
      console.error("Error searching places:", error);
    }
    setIsSearching(false);
  };

  const handlePlaceSelect = (placeId: string) => {
    const place = searchResults.find((p) => p.place_id === placeId);
    if (place) {
      setSelectedPlace(place);
      setSearchTerm("");
      setSearchResults([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Format time from minutes
      const startTime = formatTime(timeInMinutes);

      const formData: EventFormData = {
        title: title.trim(),
        date: selectedDate,
        start_time: startTime,
        place: selectedPlace?.name || "TBD",
        is_public: false, // Friends only
      };

      const result = await createEvent(formData);

      if (result.success) {
        router.push("/events/friends");
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Fehler beim Erstellen des Events");
      console.error("Error creating event:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/events/friends">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Quick Event</h1>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Was machst du? <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Lernen in der Bib"
              required
            />
          </div>

          {/* Date Selector */}
          <div className="space-y-2">
            <Label htmlFor="date">
              <CalendarIcon className="inline h-4 w-4 mr-2" />
              Datum
            </Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          {/* Time Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>
                <ClockIcon className="inline h-4 w-4 mr-2" />
                Startzeit
              </Label>
              <span className="text-2xl font-bold text-primary">
                {formatTime(timeInMinutes)}
              </span>
            </div>
            <Slider
              value={[timeInMinutes]}
              onValueChange={(value) => setTimeInMinutes(value[0])}
              min={0}
              max={1425}
              step={15}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:45</span>
            </div>
          </div>

          {/* Optional Place Search */}
          <div className="space-y-3">
            <Label htmlFor="place-search">
              <MapPinIcon className="inline h-4 w-4 mr-2" />
              Ort (optional)
            </Label>

            {selectedPlace ? (
              <Card className="p-4 bg-primary/5 border-primary">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-5 w-5 text-primary" />
                    <span className="font-medium">{selectedPlace.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPlace(null)}
                  >
                    Entfernen
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="place-search"
                    type="text"
                    placeholder="Ort suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((place) => (
                      <PlaceCard
                        key={place.place_id}
                        place={place}
                        onClick={handlePlaceSelect}
                        isSelected={false}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Info Text */}
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-sm">
            <p>
              � <strong>Sichtbarkeit:</strong> Nur für Freunde
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/events/friends")}
              disabled={loading}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1"
            >
              {loading ? "Erstelle..." : "Event erstellen"}
            </Button>
          </div>

          {/* Link to full form */}
          <div className="text-center text-sm text-muted-foreground pt-2">
            Brauchst du mehr Optionen?{" "}
            <Link href="/events/add" className="text-primary hover:underline">
              Zur erweiterten Ansicht
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
