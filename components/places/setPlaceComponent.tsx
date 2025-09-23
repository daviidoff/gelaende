"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getPlaces, getPlacesPaginated, GetPlacesParams } from "./data";
import { getUserPlaces } from "@/components/users/places/data";
import { setPlace } from "@/components/users/places/actions";
import { PlaceCard, PlaceCardData } from "./PlaceCard";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { Database } from "@/lib/types/database";

type Place = Database["public"]["Tables"]["places"]["Row"];

// Interface for the places data returned from getUserPlaces
interface ActivityPlace {
  place_id: string;
  name: string;
  location: any;
}

interface UserActivity {
  time: string;
  places: ActivityPlace | ActivityPlace[];
}

interface PaginationProps {
  currentPage: number;
  hasMore: boolean;
  onPrevious: () => void;
  onNext: () => void;
  isLoading: boolean;
}

function Pagination({
  currentPage,
  hasMore,
  onPrevious,
  onNext,
  isLoading,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onPrevious}
        disabled={currentPage <= 1 || isLoading}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>

      <span className="text-sm text-muted-foreground">Page {currentPage}</span>

      <Button
        variant="outline"
        size="sm"
        onClick={onNext}
        disabled={!hasMore || isLoading}
        className="flex items-center gap-2"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function SetPlaceComponent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [recentPlaces, setRecentPlaces] = useState<PlaceCardData[]>([]);
  const [searchResults, setSearchResults] = useState<PlaceCardData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isSettingPlace, setIsSettingPlace] = useState<string | null>(null);

  // Selected state management
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  const [selectedTimestamp, setSelectedTimestamp] = useState<number | null>(
    null
  );
  const [fadeIntensity, setFadeIntensity] = useState(0);

  // Calculate exponential fade based on time elapsed
  const calculateFadeIntensity = useCallback((timestamp: number): number => {
    const now = Date.now();
    const elapsed = now - timestamp;

    // Fade parameters
    const maxDuration = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
    const fadeRate = 0.5; // Exponential decay rate

    if (elapsed >= maxDuration) return 0;

    // Exponential decay: intensity = e^(-fadeRate * normalizedTime)
    const normalizedTime = elapsed / maxDuration;
    const intensity = Math.exp(-fadeRate * normalizedTime * 3); // Multiply by 3 for faster initial decay

    return Math.max(0, Math.min(1, intensity));
  }, []);

  // Load persisted selection state on mount
  useEffect(() => {
    const savedSelection = localStorage.getItem("selectedPlace");
    const savedTimestamp = localStorage.getItem("selectedTimestamp");

    if (savedSelection && savedTimestamp) {
      const timestamp = parseInt(savedTimestamp);
      const intensity = calculateFadeIntensity(timestamp);

      if (intensity > 0.01) {
        setSelectedPlace(savedSelection);
        setSelectedTimestamp(timestamp);
        setFadeIntensity(intensity);
      } else {
        // Clear expired selection
        localStorage.removeItem("selectedPlace");
        localStorage.removeItem("selectedTimestamp");
      }
    }
  }, [calculateFadeIntensity]);

  // Persist selection state
  useEffect(() => {
    if (selectedPlace && selectedTimestamp) {
      localStorage.setItem("selectedPlace", selectedPlace);
      localStorage.setItem("selectedTimestamp", selectedTimestamp.toString());
    } else {
      localStorage.removeItem("selectedPlace");
      localStorage.removeItem("selectedTimestamp");
    }
  }, [selectedPlace, selectedTimestamp]);

  // Update fade intensity regularly
  useEffect(() => {
    if (!selectedTimestamp) return;

    const updateFade = () => {
      const newIntensity = calculateFadeIntensity(selectedTimestamp);
      setFadeIntensity(newIntensity);

      // Clear selection if completely faded
      if (newIntensity <= 0.01) {
        setSelectedPlace(null);
        setSelectedTimestamp(null);
        setFadeIntensity(0);
      }
    };

    // Update immediately
    updateFade();

    // Set up interval to update every 30 seconds
    const interval = setInterval(updateFade, 30000);

    return () => clearInterval(interval);
  }, [selectedTimestamp, calculateFadeIntensity]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Helper function to extract address from location data
  const getAddressFromLocation = useCallback((location: any): string => {
    if (!location) return "";

    if (typeof location === "object") {
      // If location has address property, use it
      if (location.address) return location.address;

      // If location has coordinates, format them
      if (location.lat && location.lng) {
        return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
      }
    }

    return "";
  }, []);

  // Convert Place or ActivityPlace to PlaceCardData
  const convertPlaceToCardData = useCallback(
    (place: Place | ActivityPlace, time?: string): PlaceCardData => ({
      place_id: place.place_id,
      name: place.name,
      address: getAddressFromLocation(place.location),
      time,
    }),
    [getAddressFromLocation]
  );

  // Load recent places
  const loadRecentPlaces = useCallback(async () => {
    setIsLoadingRecent(true);
    try {
      const result = await getUserPlaces();
      if (result.success && result.places) {
        const recentPlacesData = result.places.map((activity) => {
          const place = Array.isArray(activity.places)
            ? activity.places[0]
            : activity.places;

          return convertPlaceToCardData(place, activity.time);
        });
        setRecentPlaces(recentPlacesData);
      }
    } catch (error) {
      console.error("Error loading recent places:", error);
    }
    setIsLoadingRecent(false);
  }, [convertPlaceToCardData]);

  // Search places
  const searchPlaces = useCallback(
    async (term: string, page: number = 1) => {
      if (!term.trim()) {
        setSearchResults([]);
        setHasMore(false);
        return;
      }

      setIsLoadingSearch(true);
      try {
        const params: GetPlacesParams = {
          searchTerm: term,
          page,
          limit: 10,
        };

        const result = await getPlacesPaginated(params);

        if (result.success && result.places) {
          const searchData = result.places.map((place) =>
            convertPlaceToCardData(place)
          );

          if (page === 1) {
            setSearchResults(searchData);
          } else {
            setSearchResults((prev) => [...prev, ...searchData]);
          }

          setHasMore(result.hasMore || false);
        }
      } catch (error) {
        console.error("Error searching places:", error);
      }
      setIsLoadingSearch(false);
    },
    [convertPlaceToCardData]
  );

  // Handle place selection
  const handlePlaceSelect = async (placeId: string) => {
    setIsSettingPlace(placeId);

    // Set selected state immediately for visual feedback
    setSelectedPlace(placeId);
    setSelectedTimestamp(Date.now());
    setFadeIntensity(1); // Start with full intensity

    try {
      const result = await setPlace(placeId);
      if (result.success) {
        // Could show a success message or navigate away
        console.log("Place set successfully");
      } else {
        console.error("Failed to set place:", result.error);
        // Reset selection on error
        setSelectedPlace(null);
        setSelectedTimestamp(null);
        setFadeIntensity(0);
      }
    } catch (error) {
      console.error("Error setting place:", error);
      // Reset selection on error
      setSelectedPlace(null);
      setSelectedTimestamp(null);
      setFadeIntensity(0);
    }
    setIsSettingPlace(null);
  };

  // Load recent places on mount
  useEffect(() => {
    loadRecentPlaces();
  }, [loadRecentPlaces]);

  // Trigger search when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      setCurrentPage(1);
      searchPlaces(debouncedSearchTerm, 1);
    } else {
      setSearchResults([]);
      setHasMore(false);
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, searchPlaces]);

  // Handle pagination
  const handlePrevious = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      searchPlaces(debouncedSearchTerm, newPage);
    }
  };

  const handleNext = () => {
    if (hasMore) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      searchPlaces(debouncedSearchTerm, newPage);
    }
  };

  const isShowingSearchResults = debouncedSearchTerm.trim().length > 0;
  const placesToShow = isShowingSearchResults ? searchResults : recentPlaces;
  const isLoading = isLoadingRecent || isLoadingSearch;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">Set Your Location</h2>
        <p className="text-muted-foreground">
          Choose from your recent places or search for a new location
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for a place..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Section Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {isShowingSearchResults ? "Search Results" : "Recent Places"}
        </h3>
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Places List */}
      <div className="space-y-3">
        {placesToShow.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            {isShowingSearchResults
              ? "No places found. Try a different search term."
              : "No recent places found."}
          </div>
        )}

        {placesToShow.map((place) => (
          <PlaceCard
            key={place.place_id}
            place={place}
            onClick={handlePlaceSelect}
            isLoading={isSettingPlace === place.place_id}
            isSelected={selectedPlace === place.place_id}
            fadeIntensity={selectedPlace === place.place_id ? fadeIntensity : 0}
          />
        ))}
      </div>

      {/* Pagination - only show for search results */}
      {isShowingSearchResults &&
        (searchResults.length > 0 || currentPage > 1) && (
          <Pagination
            currentPage={currentPage}
            hasMore={hasMore}
            onPrevious={handlePrevious}
            onNext={handleNext}
            isLoading={isLoadingSearch}
          />
        )}
    </div>
  );
}
