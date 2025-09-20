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

// Utility functions
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

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

function randomFutureDate(daysAhead: number = 7): string {
  const now = new Date();
  const futureDate = new Date(
    now.getTime() + Math.random() * daysAhead * 24 * 60 * 60 * 1000
  );
  return futureDate.toISOString();
}

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

// Bulk creation functions
export function createTestUsers(count: number): TestUser[] {
  return Array.from({ length: count }, () => createTestUser());
}

export function createTestPlaces(count: number): TestPlace[] {
  return Array.from({ length: count }, () => createTestPlace());
}

// Create a complete test scenario
export interface TestScenario {
  users: TestUser[];
  places: TestPlace[];
  activities: TestActivity[];
  friendships: TestFriendship[];
  friendshipInvites: TestFriendshipInvite[];
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

  return {
    users,
    places,
    activities,
    friendships,
    friendshipInvites,
  };
}

// Predefined test scenarios
export const SMALL_TEST_SCENARIO = createTestScenario(3, 2, 1);
export const MEDIUM_TEST_SCENARIO = createTestScenario(8, 5, 3);
export const LARGE_TEST_SCENARIO = createTestScenario(20, 10, 5);
