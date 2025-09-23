"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPlaces } from "./data";
import { setPlace } from "./actions";
import type { Database } from "@/lib/types/database";

type Place = Database["public"]["Tables"]["places"]["Row"];

interface SetPlaceComponentProps {
  className?: string;
  onPlaceSet?: (place: Place) => void;
}

export function SetPlaceComponent({
  className,
  onPlaceSet,
  ...props
}: SetPlaceComponentProps & React.ComponentPropsWithoutRef<"div">) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSettingPlace, setIsSettingPlace] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const result = await getPlaces(term);
        if (result.success) {
          setSearchResults(result.places || []);
        } else {
          setError(result.message);
          setSearchResults([]);
        }
      } catch (err) {
        setError("Failed to search places");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  // Effect for debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSearch(searchTerm);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearch]);

  // Clear messages when user starts typing
  useEffect(() => {
    if (searchTerm) {
      setError(null);
      setSuccessMessage(null);
    }
  }, [searchTerm]);

  // Handle setting the selected place
  const handleSetPlace = async () => {
    if (!selectedPlace) return;

    setIsSettingPlace(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await setPlace({
        name: selectedPlace.name,
        location: selectedPlace.location as { lat: number; lng: number } | null,
        place_id: selectedPlace.place_id,
      });

      if (result.success) {
        setSuccessMessage(`Successfully set "${selectedPlace.name}" as your place!`);
        setSearchTerm("");
        setSearchResults([]);
        setSelectedPlace(null);
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
        
        // Call the optional callback
        if (onPlaceSet && result.place) {
          onPlaceSet(result.place);
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to set place. Please try again.");
    } finally {
      setIsSettingPlace(false);
    }
  };

  return (
    <div className={cn("w-full max-w-md mx-auto", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Set Your Place</CardTitle>
          <CardDescription>
            Search for a place and select it to set as your location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search-place">Search for a place</Label>
            <Input
              id="search-place"
              type="text"
              placeholder="Enter place name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isSearching || isSettingPlace}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
              {successMessage}
            </div>
          )}

          {/* Loading indicator */}
          {isSearching && (
            <div className="text-sm text-gray-600 p-3 flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              <span>Searching for places...</span>
            </div>
          )}

          {/* Search Results will go here */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <Label>Search Results</Label>
              <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
                {searchResults.map((place) => (
                  <button
                    key={place.place_id}
                    onClick={() => setSelectedPlace(place)}
                    className={cn(
                      "w-full text-left p-2 rounded-md text-sm transition-colors",
                      "hover:bg-gray-100 focus:bg-gray-100 focus:outline-none",
                      selectedPlace?.place_id === place.place_id
                        ? "bg-blue-100 border border-blue-300"
                        : "bg-white border border-gray-200"
                    )}
                    disabled={isSettingPlace}
                  >
                    <div className="font-medium">{place.name}</div>
                    {place.location && (
                      <div className="text-gray-500 text-xs">
                        Location available
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results message */}
          {searchTerm.trim() && !isSearching && searchResults.length === 0 && !error && (
            <div className="text-sm text-gray-500 p-3 text-center">
              No places found for "{searchTerm}"
            </div>
          )}
          
          {/* Selected Place will go here */}
          {selectedPlace && (
            <div className="space-y-3">
              <Label>Selected Place</Label>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">
                        {selectedPlace.name}
                      </h4>
                      {selectedPlace.location && (
                        <p className="text-sm text-blue-700">
                          Location: Available
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPlace(null)}
                      disabled={isSettingPlace}
                    >
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Button
                onClick={handleSetPlace}
                disabled={isSettingPlace}
                className="w-full"
              >
                {isSettingPlace ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Setting Place...</span>
                  </div>
                ) : (
                  "Set This Place"
                )}
              </Button>
            </div>
          )}
          
        </CardContent>
      </Card>
    </div>
  );
}
