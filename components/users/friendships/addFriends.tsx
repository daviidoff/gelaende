"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  searchUsers,
  createFriendshipInvite,
  type SearchUsersResult,
} from "./actions";

interface User {
  profile_id: string;
  name: string;
  studiengang: string | null;
  university: string | null;
  user_id: string;
}

export default function AddFriends() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingInvites, setSendingInvites] = useState<Set<string>>(new Set());
  const [sentInvites, setSentInvites] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState("");

  const handleSearch = async () => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      setErrorMessage("Please enter at least 2 characters to search");
      return;
    }

    setIsSearching(true);
    setErrorMessage("");

    try {
      const result = await searchUsers(searchTerm);

      if (result.success) {
        setSearchResults(result.users || []);
        if ((result.users || []).length === 0) {
          setErrorMessage("No users found matching your search");
        }
      } else {
        setErrorMessage(result.message);
        setSearchResults([]);
      }
    } catch (error) {
      setErrorMessage("An error occurred while searching");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (userId: string, userName: string) => {
    setSendingInvites((prev) => new Set(prev).add(userId));
    setErrorMessage("");

    try {
      const result = await createFriendshipInvite(userId);

      if (result.success) {
        setSentInvites((prev) => new Set(prev).add(userId));
        // Optionally remove from search results
        setSearchResults((prev) =>
          prev.filter((user) => user.user_id !== userId)
        );
      } else {
        setErrorMessage(
          `Failed to send invite to ${userName}: ${result.message}`
        );
      }
    } catch (error) {
      setErrorMessage(`An error occurred while sending invite to ${userName}`);
    } finally {
      setSendingInvites((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Add Friends</h2>
        <p className="text-gray-600">
          Search for users to send friend requests
        </p>
      </div>

      {/* Search Section */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching || searchTerm.trim().length < 2}
          >
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>

        {errorMessage && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Search Results</h3>
          <div className="space-y-3">
            {searchResults.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{user.name}</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    {user.studiengang && <p>Studiengang: {user.studiengang}</p>}
                    {user.university && <p>University: {user.university}</p>}
                  </div>
                </div>
                <div className="ml-4">
                  {sentInvites.has(user.user_id) ? (
                    <div className="text-green-600 text-sm font-medium">
                      Invite Sent ✓
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleAddFriend(user.user_id, user.name)}
                      disabled={sendingInvites.has(user.user_id)}
                      variant="outline"
                      size="sm"
                    >
                      {sendingInvites.has(user.user_id)
                        ? "Sending..."
                        : "Add Friend"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
        <p>💡 Tips:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Enter at least 2 characters to search</li>
          <li>You won't see users you're already friends with</li>
          <li>Users with pending invites won't appear in search results</li>
        </ul>
      </div>
    </div>
  );
}
