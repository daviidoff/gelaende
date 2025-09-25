"use client";

import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useState } from "react";
import { pingFriend } from "./pingActions";

interface PingButtonProps {
  friendId: string;
  friendName: string;
  onPingClick?: (success: boolean, message: string) => void;
}

export function PingButton({
  friendId,
  friendName,
  onPingClick,
}: PingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [justPinged, setJustPinged] = useState(false);

  const handlePing = async () => {
    if (isLoading || justPinged) return;

    setIsLoading(true);

    try {
      const result = await pingFriend(friendId);

      if (result.success) {
        setJustPinged(true);
        onPingClick?.(true, result.message);

        // Reset the "just pinged" state after a few seconds
        setTimeout(() => setJustPinged(false), 3000);
      } else {
        onPingClick?.(false, result.message);
      }
    } catch (error) {
      console.error("Failed to ping friend:", error);
      onPingClick?.(false, "Failed to send ping");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handlePing}
      disabled={isLoading || justPinged}
      className={`
        p-2 h-8 w-8 rounded-full transition-all duration-200
        ${
          justPinged
            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
            : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/70 hover:text-white"
        }
        ${isLoading ? "animate-pulse" : ""}
      `}
      title={justPinged ? `Pinged ${friendName}!` : `Ping ${friendName}`}
    >
      <Zap className={`h-4 w-4 ${isLoading ? "animate-bounce" : ""}`} />
    </Button>
  );
}
