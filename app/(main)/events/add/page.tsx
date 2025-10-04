"use client";

import { createEvent } from "@/components/tabs/events/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EventFormData } from "@/lib/types/database";
import { ArrowLeft, CalendarIcon, MapPinIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const EVENT_CATEGORIES = [
  "Sport",
  "Musik",
  "Kunst & Kultur",
  "Gaming",
  "Lernen",
  "Essen & Trinken",
  "Party",
  "Outdoor",
  "Sonstiges",
] as const;

export default function AddEventPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    date: "",
    start_time: "",
    end_time: "",
    place: "",
    location_details: "",
    max_attendees: undefined,
    category: "",
    is_public: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? value === ""
            ? undefined
            : parseInt(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
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
          <h1 className="text-2xl font-bold">Event erstellen</h1>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">
              Titel <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="z.B. Gemeinsames Lernen in der Bibliothek"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Beschreibe dein Event..."
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">
                Datum <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_time">Startzeit</Label>
              <Input
                id="start_time"
                name="start_time"
                type="time"
                value={formData.start_time}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">Endzeit</Label>
              <Input
                id="end_time"
                name="end_time"
                type="time"
                value={formData.end_time}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="place">
              Ort <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="place"
                name="place"
                value={formData.place}
                onChange={handleInputChange}
                placeholder="z.B. Universitätsbibliothek"
                required
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_details">
              Zusätzliche Ortsinformationen
            </Label>
            <Input
              id="location_details"
              name="location_details"
              value={formData.location_details}
              onChange={handleInputChange}
              placeholder="z.B. 3. Stock, Raum 301"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_attendees">Max. Teilnehmer</Label>
              <div className="relative">
                <UsersIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="max_attendees"
                  name="max_attendees"
                  type="number"
                  min="1"
                  value={formData.max_attendees || ""}
                  onChange={handleInputChange}
                  placeholder="Unbegrenzt"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategorie</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_public"
              checked={formData.is_public}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  is_public: checked as boolean,
                }))
              }
            />
            <Label
              htmlFor="is_public"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Öffentliches Event (für alle sichtbar)
            </Label>
          </div>

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
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Erstelle..." : "Event erstellen"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
