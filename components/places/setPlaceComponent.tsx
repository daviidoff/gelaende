"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getPlaces, getPlacesPaginated, GetPlacesParams } from "./data";
import { getUserPlaces } from "@/components/users/places/data";
import { setPlace } from "@/components/users/places/actions";
import { Search, MapPin, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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

interface PlaceCardData {
  place_id: string;
  name: string;
  address?: string;
  time?: string; // For recent places
}

interface PlaceCardProps {
  place: PlaceCardData;
  onClick: (placeId: string) => void;
  isLoading?: boolean;
}

function PlaceCard({ place, onClick, isLoading }: PlaceCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick(place.place_id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight">{place.name}</h3>
            {place.address && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {place.address}
              </p>
            )}
            {place.time && (
              <p className="text-xs text-muted-foreground mt-1">
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

interface PaginationProps {
  currentPage: number;
  hasMore: boolean;
  onPrevious: () => void;
  onNext: () => void;
  isLoading: boolean;
}

function Pagination({ currentPage, hasMore, onPrevious, onNext, isLoading }: PaginationProps) {
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
      
      <span className="text-sm text-muted-foreground">
        Page {currentPage}
      </span>
      
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
    
    if (typeof location === 'object') {
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
  const convertPlaceToCardData = useCallback((place: Place | ActivityPlace, time?: string): PlaceCardData => ({
    place_id: place.place_id,
    name: place.name,
    address: getAddressFromLocation(place.location),
    time,
  }), [getAddressFromLocation]);

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
  const searchPlaces = useCallback(async (term: string, page: number = 1) => {
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
          setSearchResults(prev => [...prev, ...searchData]);
        }
        
        setHasMore(result.hasMore || false);
      }
    } catch (error) {
      console.error("Error searching places:", error);
    }
    setIsLoadingSearch(false);
  }, [convertPlaceToCardData]);

  // Handle place selection
  const handlePlaceSelect = async (placeId: string) => {
    setIsSettingPlace(placeId);
    try {
      const result = await setPlace(placeId);
      if (result.success) {
        // Could show a success message or navigate away
        console.log("Place set successfully");
      } else {
        console.error("Failed to set place:", result.error);
      }
    } catch (error) {
      console.error("Error setting place:", error);
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
          />
        ))}
      </div>

      {/* Pagination - only show for search results */}
      {isShowingSearchResults && (searchResults.length > 0 || currentPage > 1) && (
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
