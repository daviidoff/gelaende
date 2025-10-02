// Test data utilities for generating realistic test data
// This module provides functions to create test users, profiles, friendships, places, and activities

export interface TestUser {
  id: string;
  email: string;
  name: string;
  studiengang?: string;
  university?: string;
}

export interface TestPlace {
  place_id: string;
  name: string;
  location: {
    type: "coordinates" | "address";
    lat?: number;
    lng?: number;
    address?: string;
    city?: string;
  };
}

export interface TestActivity {
  activity_id: string;
  user_id: string;
  place_id: string;
  time: string;
}

export interface TestFriendship {
  friendship_id: string;
  user1_id: string;
  user2_id: string;
}

export interface TestFriendshipInvite {
  invite_id: string;
  requester_id: string;
  requestee_id: string;
  status: "pending" | "accepted" | "rejected";
}

export interface TestEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  place: string;
  location_details?: string;
  max_attendees?: number;
  category: string;
  is_public: boolean;
  status: "draft" | "published" | "cancelled" | "completed";
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TestEventAttendee {
  event_id: string;
  user_id: string;
  status: "pending" | "confirmed" | "declined";
  joined_at: string;
}

export interface TestEventOrganizer {
  event_id: string;
  user_id: string;
  role: "organizer" | "co-organizer" | "admin";
  assigned_at: string;
}

export interface TestEventWithDetails extends TestEvent {
  creator_profile?: TestUser;
  attendees?: TestEventAttendee[];
  organizers?: TestEventOrganizer[];
  attendee_count?: number;
  confirmed_count?: number;
}

// Sample data pools
const FIRST_NAMES = [
  "Max",
  "Anna",
  "David",
  "Julia",
  "Felix",
  "Laura",
  "Leon",
  "Emma",
  "Noah",
  "Mia",
  "Paul",
  "Lina",
  "Ben",
  "Lea",
  "Tim",
  "Marie",
  "Jan",
  "Sarah",
  "Tom",
  "Lisa",
  "Finn",
  "Clara",
  "Luca",
  "Sophie",
];

const LAST_NAMES = [
  "Müller",
  "Schmidt",
  "Schneider",
  "Fischer",
  "Weber",
  "Meyer",
  "Wagner",
  "Becker",
  "Schulz",
  "Hoffmann",
  "Schäfer",
  "Koch",
  "Bauer",
  "Richter",
  "Klein",
  "Wolf",
  "Schröder",
  "Neumann",
];

const STUDIENGAENGE = [
  "Informatik",
  "Maschinenbau",
  "Elektrotechnik",
  "BWL",
  "Medizin",
  "Psychologie",
  "Jura",
  "Architektur",
  "Physik",
  "Chemie",
  "Biologie",
  "Mathematik",
  "Geschichte",
  "Germanistik",
  "Anglistik",
];

const UNIVERSITIES = [
  "TU München",
  "LMU München",
  "Uni Heidelberg",
  "RWTH Aachen",
  "TU Berlin",
  "Uni Hamburg",
  "Uni Köln",
  "TU Dresden",
  "Uni Stuttgart",
  "KIT Karlsruhe",
  "Uni Münster",
  "Uni Würzburg",
];

const PLACE_NAMES = [
  "Universitätsbibliothek",
  "Mensa Zentral",
  "Studentenwohnheim Nord",
  "Campus Café",
  "Sportplatz",
  "Hörsaal A",
  "Labor 3.14",
  "Parkplatz C",
  "Audimax",
  "Bibliothek Informatik",
  "Cafeteria Technik",
  "Studierendenhaus",
  "Botanischer Garten",
  "Fitness Studio",
  "Mensa West",
  "Buchhandlung",
  "Co-Working Space",
  "Seminarraum 12",
  "Computerraum",
  "Sprachenzentrum",
];

const CITIES = [
  "München",
  "Berlin",
  "Hamburg",
  "Köln",
  "Frankfurt",
  "Stuttgart",
  "Düsseldorf",
  "Dortmund",
  "Essen",
  "Leipzig",
  "Bremen",
  "Dresden",
  "Hannover",
  "Nürnberg",
  "Duisburg",
  "Bochum",
  "Wuppertal",
  "Bielefeld",
];

const EVENT_TITLES = [
  "Lernsession Mathe",
  "Coding Bootcamp",
  "Kaffee & Code",
  "Studiengruppe BWL",
  "Hackathon Wochenende",
  "Projektpräsentation",
  "Networking Event",
  "Tech Talk",
  "Workshop JavaScript",
  "Study Break Party",
  "Examen Vorbereitung",
  "Algorithmen Workshop",
  "Startup Pitch Night",
  "Open Source Meetup",
  "Design Thinking Session",
  "Career Fair",
  "Uni Sport Event",
  "Biergarten Meetup",
  "Cultural Exchange",
  "Research Presentation",
];

const EVENT_CATEGORIES = [
  "study",
  "social",
  "workshop",
  "networking",
  "sports",
  "cultural",
  "career",
  "tech",
  "academic",
  "entertainment",
];

const EVENT_DESCRIPTIONS = [
  "Ein entspanntes Treffen zum gemeinsamen Lernen und Austausch von Ideen.",
  "Praktischer Workshop mit Hands-on Übungen und Diskussionen.",
  "Networking Event für Studierende verschiedener Fachrichtungen.",
  "Intensive Lernsession zur Vorbereitung auf kommende Prüfungen.",
  "Informelle Runde zum Kennenlernen und Erfahrungsaustausch.",
  "Präsentation aktueller Projekte und Forschungsergebnisse.",
  "Praktische Übungen und Gruppenarbeit zu relevanten Themen.",
  "Offene Diskussion und Brainstorming Session.",
  "Entspannte Atmosphäre zum Lernen und Socializing.",
  "Professionelle Weiterbildung mit Zertifikat.",
];

// Utility functions
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// function randomId(): string {
//   return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
// }

function randomUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function randomEmail(name: string): string {
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "web.de", "gmx.de"];
  const sanitized = name.toLowerCase().replace(/\s+/g, ".");
  return `${sanitized}@${randomChoice(domains)}`;
}

function randomFutureDate(daysAhead: number): string {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(
    today.getDate() + Math.floor(Math.random() * daysAhead) + 1
  );
  return futureDate.toISOString().split("T")[0];
}

function randomTime(afterTime?: string): string {
  let startHour = 8; // Default start at 8 AM

  if (afterTime) {
    const [hour] = afterTime.split(":").map(Number);
    startHour = Math.max(hour + 1, 8); // At least 1 hour later, but not before 8 AM
  }

  const hour = startHour + Math.floor(Math.random() * (20 - startHour)); // Up to 8 PM
  const minute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, or 45 minutes

  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
}

function randomCoordinates(): { lat: number; lng: number } {
  // German coordinates (roughly)
  const lat = 47 + Math.random() * 8; // 47-55°N
  const lng = 6 + Math.random() * 10; // 6-16°E
  return {
    lat: Math.round(lat * 1000000) / 1000000,
    lng: Math.round(lng * 1000000) / 1000000,
  };
}

function randomPastDate(daysBack: number = 30): string {
  const now = new Date();
  const pastDate = new Date(
    now.getTime() - Math.random() * daysBack * 24 * 60 * 60 * 1000
  );
  return pastDate.toISOString();
}

// function randomFutureDate(daysAhead: number = 7): string {
//   const now = new Date();
//   const futureDate = new Date(
//     now.getTime() + Math.random() * daysAhead * 24 * 60 * 60 * 1000
//   );
//   return futureDate.toISOString();
// }

// Main factory functions
export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  const firstName = randomChoice(FIRST_NAMES);
  const lastName = randomChoice(LAST_NAMES);
  const name = `${firstName} ${lastName}`;

  return {
    id: randomUUID(),
    email: randomEmail(name),
    name,
    studiengang: randomChoice(STUDIENGAENGE),
    university: randomChoice(UNIVERSITIES),
    ...overrides,
  };
}

export function createTestPlace(overrides: Partial<TestPlace> = {}): TestPlace {
  const coordinates = randomCoordinates();
  const city = randomChoice(CITIES);

  return {
    place_id: randomUUID(),
    name: randomChoice(PLACE_NAMES),
    location: {
      type: "coordinates",
      ...coordinates,
      address: `${randomChoice(PLACE_NAMES)}, ${city}`,
      city,
    },
    ...overrides,
  };
}

export function createTestActivity(
  userId: string,
  placeId: string,
  overrides: Partial<TestActivity> = {}
): TestActivity {
  return {
    activity_id: randomUUID(),
    user_id: userId,
    place_id: placeId,
    time: randomPastDate(7),
    ...overrides,
  };
}

export function createTestFriendship(
  user1Id: string,
  user2Id: string,
  overrides: Partial<TestFriendship> = {}
): TestFriendship {
  return {
    friendship_id: randomUUID(),
    user1_id: user1Id,
    user2_id: user2Id,
    ...overrides,
  };
}

export function createTestFriendshipInvite(
  requesterId: string,
  requesteeId: string,
  overrides: Partial<TestFriendshipInvite> = {}
): TestFriendshipInvite {
  return {
    invite_id: randomUUID(),
    requester_id: requesterId,
    requestee_id: requesteeId,
    status: "pending",
    ...overrides,
  };
}

export function createTestEvent(
  creatorId: string,
  overrides: Partial<TestEvent> = {}
): TestEvent {
  const futureDate = randomFutureDate(30); // Random date within next 30 days
  const startTime = randomTime();
  const endTime = randomTime(startTime);
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    title: randomChoice(EVENT_TITLES),
    description: randomChoice(EVENT_DESCRIPTIONS),
    date: futureDate,
    start_time: startTime,
    end_time: endTime,
    place: randomChoice(PLACE_NAMES),
    location_details: `Near ${randomChoice(PLACE_NAMES)}, ${randomChoice(
      CITIES
    )}`,
    max_attendees: randomChoice([10, 20, 25, 30, 50, 100]),
    category: randomChoice(EVENT_CATEGORIES),
    is_public: Math.random() > 0.3, // 70% public events
    status: randomChoice(["draft", "published", "published", "published"]), // 75% published
    created_by: creatorId,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

export function createTestEventAttendee(
  eventId: string,
  userId: string,
  overrides: Partial<TestEventAttendee> = {}
): TestEventAttendee {
  return {
    event_id: eventId,
    user_id: userId,
    status: randomChoice(["pending", "confirmed", "confirmed", "declined"]), // 50% confirmed, 25% pending, 25% declined
    joined_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createTestEventOrganizer(
  eventId: string,
  userId: string,
  overrides: Partial<TestEventOrganizer> = {}
): TestEventOrganizer {
  return {
    event_id: eventId,
    user_id: userId,
    role: randomChoice(["organizer", "co-organizer", "admin"]),
    assigned_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createTestEventWithDetails(
  creatorId: string,
  attendeeIds: string[] = [],
  organizerIds: string[] = [],
  overrides: Partial<TestEventWithDetails> = {}
): TestEventWithDetails {
  const event = createTestEvent(creatorId, overrides);

  const attendees = attendeeIds.map((userId) =>
    createTestEventAttendee(event.id, userId)
  );

  const organizers = [
    createTestEventOrganizer(event.id, creatorId, { role: "organizer" }),
    ...organizerIds.map((userId) => createTestEventOrganizer(event.id, userId)),
  ];

  const confirmedCount = attendees.filter(
    (a) => a.status === "confirmed"
  ).length;

  return {
    ...event,
    creator_profile: createTestUser({ id: creatorId }),
    attendees,
    organizers,
    attendee_count: attendees.length,
    confirmed_count: confirmedCount,
    ...overrides,
  };
}

// Bulk creation functions
export function createTestUsers(count: number): TestUser[] {
  return Array.from({ length: count }, () => createTestUser());
}

export function createTestPlaces(count: number): TestPlace[] {
  return Array.from({ length: count }, () => createTestPlace());
}

export function createTestEvents(
  count: number,
  creatorIds: string[]
): TestEvent[] {
  return Array.from({ length: count }, () => {
    const creatorId = randomChoice(creatorIds);
    return createTestEvent(creatorId);
  });
}

export function createTestEventAttendees(
  eventId: string,
  userIds: string[]
): TestEventAttendee[] {
  return userIds.map((userId) => createTestEventAttendee(eventId, userId));
}

// Create a complete test scenario
export interface TestScenario {
  users: TestUser[];
  places: TestPlace[];
  activities: TestActivity[];
  friendships: TestFriendship[];
  friendshipInvites: TestFriendshipInvite[];
  events: TestEvent[];
  eventAttendees: TestEventAttendee[];
  eventOrganizers: TestEventOrganizer[];
}

export function createTestScenario(
  userCount: number = 5,
  placeCount: number = 3,
  activitiesPerUser: number = 2
): TestScenario {
  const users = createTestUsers(userCount);
  const places = createTestPlaces(placeCount);

  // Create activities for each user
  const activities: TestActivity[] = [];
  users.forEach((user) => {
    for (let i = 0; i < activitiesPerUser; i++) {
      const place = randomChoice(places);
      activities.push(createTestActivity(user.id, place.place_id));
    }
  });

  // Create some friendships (about 30% of possible pairs)
  const friendships: TestFriendship[] = [];
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      if (Math.random() < 0.3) {
        friendships.push(createTestFriendship(users[i].id, users[j].id));
      }
    }
  }

  // Create some pending friendship invites
  const friendshipInvites: TestFriendshipInvite[] = [];
  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < users.length; j++) {
      if (i !== j && Math.random() < 0.1) {
        // Check if they're not already friends
        const areFriends = friendships.some(
          (f) =>
            (f.user1_id === users[i].id && f.user2_id === users[j].id) ||
            (f.user1_id === users[j].id && f.user2_id === users[i].id)
        );

        if (!areFriends) {
          friendshipInvites.push(
            createTestFriendshipInvite(users[i].id, users[j].id)
          );
        }
      }
    }
  }

  // Create events (2-4 per user)
  const events: TestEvent[] = [];
  const eventAttendees: TestEventAttendee[] = [];
  const eventOrganizers: TestEventOrganizer[] = [];

  users.forEach((user) => {
    const eventCount = 2 + Math.floor(Math.random() * 3); // 2-4 events per user
    for (let i = 0; i < eventCount; i++) {
      const event = createTestEvent(user.id);
      events.push(event);

      // Add creator as organizer
      eventOrganizers.push(
        createTestEventOrganizer(event.id, user.id, { role: "organizer" })
      );

      // Add some random attendees (friends are more likely to attend)
      const potentialAttendees = users.filter((u) => u.id !== user.id);
      const attendeeCount = Math.floor(
        Math.random() * Math.min(5, potentialAttendees.length)
      );

      const selectedAttendees = potentialAttendees
        .sort(() => Math.random() - 0.5)
        .slice(0, attendeeCount);

      selectedAttendees.forEach((attendee) => {
        // Check if they're friends (higher chance of attendance)
        const areFriends = friendships.some(
          (f) =>
            (f.user1_id === user.id && f.user2_id === attendee.id) ||
            (f.user1_id === attendee.id && f.user2_id === user.id)
        );

        const status = areFriends
          ? randomChoice([
              "confirmed",
              "confirmed",
              "confirmed",
              "pending",
            ] as const) // 75% confirmed for friends
          : randomChoice(["confirmed", "pending", "declined"] as const); // 33% each for non-friends

        eventAttendees.push(
          createTestEventAttendee(event.id, attendee.id, { status })
        );
      });
    }
  });

  return {
    users,
    places,
    activities,
    friendships,
    friendshipInvites,
    events,
    eventAttendees,
    eventOrganizers,
  };
}

// Predefined test scenarios
export const SMALL_TEST_SCENARIO = createTestScenario(3, 2, 1);
export const MEDIUM_TEST_SCENARIO = createTestScenario(8, 5, 3);
export const LARGE_TEST_SCENARIO = createTestScenario(20, 10, 5);
