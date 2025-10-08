"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RefreshButton() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    router.refresh();
    // Reset refreshing state after a short delay
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <Button
      onClick={handleRefresh}
      variant="outline"
      size="sm"
      disabled={refreshing}
    >
      <RefreshCw
        className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
      />
      Aktualisieren
    </Button>
  );
}
