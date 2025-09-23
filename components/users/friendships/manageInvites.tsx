"use client";

import { useState, useEffect } from "react";
import { getFriendshipInvites } from "./data";
import { acceptFriendshipInvite } from "./actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FriendshipInvite {
  invite_id: string;
  requester_id: string;
  requestee_id: string;
  status: string;
  created_at: string;
  requester_profile?: {
    profile_id: string;
    name: string;
    studiengang: string | null;
    university: string | null;
    user_id: string;
  };
  requestee_profile?: {
    profile_id: string;
    name: string;
    studiengang: string | null;
    university: string | null;
    user_id: string;
  };
}

interface InvitesData {
  received: FriendshipInvite[];
  sent: FriendshipInvite[];
}

export default function ManageInvites() {
  const [invites, setInvites] = useState<InvitesData>({
    received: [],
    sent: [],
  });
  const [loading, setLoading] = useState(true);
  const [hiddenInvites, setHiddenInvites] = useState<Set<string>>(new Set());
  const [processingInvites, setProcessingInvites] = useState<Set<string>>(
    new Set()
  );
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load invites on component mount
  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    setLoading(true);
    try {
      const result = await getFriendshipInvites();
      if (result.success && result.data) {
        setInvites(result.data);
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load invites" });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    setProcessingInvites((prev) => new Set(prev).add(inviteId));
    try {
      const result = await acceptFriendshipInvite(inviteId);
      if (result.success) {
        setMessage({ type: "success", text: result.message });
        // Reload invites to update the UI
        await loadInvites();
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to accept invite" });
    } finally {
      setProcessingInvites((prev) => {
        const newSet = new Set(prev);
        newSet.delete(inviteId);
        return newSet;
      });
    }
  };

  const handleHideInvite = (inviteId: string) => {
    setHiddenInvites((prev) => new Set(prev).add(inviteId));
    setMessage({ type: "success", text: "Invite hidden" });
  };

  const clearMessage = () => {
    setMessage(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading invites...</div>
      </div>
    );
  }

  const visibleReceivedInvites = invites.received.filter(
    (invite) => !hiddenInvites.has(invite.invite_id)
  );

  const visibleSentInvites = invites.sent.filter(
    (invite) => !hiddenInvites.has(invite.invite_id)
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Friendship Invites</h1>
        <Button onClick={loadInvites} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Message Display */}
      {message && (
        <Card
          className={`p-4 ${
            message.type === "success"
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={
                message.type === "success" ? "text-green-800" : "text-red-800"
              }
            >
              {message.text}
            </span>
            <Button onClick={clearMessage} variant="ghost" size="sm">
              ×
            </Button>
          </div>
        </Card>
      )}

      {/* Received Invites Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold">Received Invites</h2>
          {visibleReceivedInvites.length > 0 && (
            <Badge variant="secondary">{visibleReceivedInvites.length}</Badge>
          )}
        </div>

        {visibleReceivedInvites.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            No pending friendship invites received
          </Card>
        ) : (
          <div className="grid gap-4">
            {visibleReceivedInvites.map((invite) => (
              <Card key={invite.invite_id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">
                        {invite.requester_profile?.name || "Unknown User"}
                      </h3>
                      <Badge variant="outline">Invite Received</Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {invite.requester_profile?.studiengang && (
                        <p>Studies: {invite.requester_profile.studiengang}</p>
                      )}
                      {invite.requester_profile?.university && (
                        <p>University: {invite.requester_profile.university}</p>
                      )}
                      <p>
                        Received:{" "}
                        {new Date(invite.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAcceptInvite(invite.invite_id)}
                      disabled={processingInvites.has(invite.invite_id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processingInvites.has(invite.invite_id)
                        ? "Accepting..."
                        : "Accept"}
                    </Button>
                    <Button
                      onClick={() => handleHideInvite(invite.invite_id)}
                      variant="outline"
                    >
                      Hide
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Sent Invites Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold">Sent Invites</h2>
          {visibleSentInvites.length > 0 && (
            <Badge variant="secondary">{visibleSentInvites.length}</Badge>
          )}
        </div>

        {visibleSentInvites.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            No pending friendship invites sent
          </Card>
        ) : (
          <div className="grid gap-4">
            {visibleSentInvites.map((invite) => (
              <Card key={invite.invite_id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">
                        {invite.requestee_profile?.name || "Unknown User"}
                      </h3>
                      <Badge variant="outline">Invite Sent</Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {invite.requestee_profile?.studiengang && (
                        <p>Studies: {invite.requestee_profile.studiengang}</p>
                      )}
                      {invite.requestee_profile?.university && (
                        <p>University: {invite.requestee_profile.university}</p>
                      )}
                      <p>
                        Sent: {new Date(invite.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Pending</Badge>
                    <Button
                      onClick={() => handleHideInvite(invite.invite_id)}
                      variant="outline"
                      size="sm"
                    >
                      Hide
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
