/**
 * Enhanced Database seeding script with comprehensive dummy data
 * This script creates a larger, more diverse set of test data for development
 *
 * Usage:
 * 1. Make sure you have SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local
 * 2. Run: node scripts/seed-enhanced.js
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing required environment variables:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL");
  console.error("   SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Create admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Enhanced test data with more diversity
const ENHANCED_TEST_USERS = [
  // Computer Science Students
  {
    email: "max.mueller@tum.de",
    password: "testpass123",
    name: "Max Müller",
    studiengang: "Informatik",
    university: "TU München",
  },
  {
    email: "anna.schmidt@tum.de",
    password: "testpass123",
    name: "Anna Schmidt",
    studiengang: "Computational Science and Engineering",
    university: "TU München",
  },
  {
    email: "david.fischer@tum.de",
    password: "testpass123",
    name: "David Fischer",
    studiengang: "Data Engineering and Analytics",
    university: "TU München",
  },

  // Engineering Students
  {
    email: "julia.weber@tum.de",
    password: "testpass123",
    name: "Julia Weber",
    studiengang: "Maschinenbau",
    university: "TU München",
  },
  {
    email: "felix.meyer@tum.de",
    password: "testpass123",
    name: "Felix Meyer",
    studiengang: "Elektrotechnik",
    university: "TU München",
  },
  {
    email: "laura.wagner@tum.de",
    password: "testpass123",
    name: "Laura Wagner",
    studiengang: "Bauingenieurwesen",
    university: "TU München",
  },
  {
    email: "leon.becker@tum.de",
    password: "testpass123",
    name: "Leon Becker",
    studiengang: "Chemieingenieurwesen",
    university: "TU München",
  },
  {
    email: "emma.schulz@tum.de",
    password: "testpass123",
    name: "Emma Schulz",
    studiengang: "Physik",
    university: "TU München",
  },

  // LMU Students
  {
    email: "sophia.richter@lmu.de",
    password: "testpass123",
    name: "Sophia Richter",
    studiengang: "BWL",
    university: "LMU München",
  },
  {
    email: "noah.zimmermann@lmu.de",
    password: "testpass123",
    name: "Noah Zimmermann",
    studiengang: "Jura",
    university: "LMU München",
  },
  {
    email: "mia.hoffmann@lmu.de",
    password: "testpass123",
    name: "Mia Hoffmann",
    studiengang: "Medizin",
    university: "LMU München",
  },
  {
    email: "paul.kraus@lmu.de",
    password: "testpass123",
    name: "Paul Kraus",
    studiengang: "Psychologie",
    university: "LMU München",
  },
  {
    email: "lena.wolf@lmu.de",
    password: "testpass123",
    name: "Lena Wolf",
    studiengang: "Biologie",
    university: "LMU München",
  },
  {
    email: "tim.neumann@lmu.de",
    password: "testpass123",
    name: "Tim Neumann",
    studiengang: "Geschichte",
    university: "LMU München",
  },

  // HM Students (Hochschule München)
  {
    email: "sara.lange@hm.edu",
    password: "testpass123",
    name: "Sara Lange",
    studiengang: "Angewandte Informatik",
    university: "Hochschule München",
  },
  {
    email: "jan.klein@hm.edu",
    password: "testpass123",
    name: "Jan Klein",
    studiengang: "Wirtschaftsinformatik",
    university: "Hochschule München",
  },
  {
    email: "lisa.peters@hm.edu",
    password: "testpass123",
    name: "Lisa Peters",
    studiengang: "Design",
    university: "Hochschule München",
  },
  {
    email: "marco.braun@hm.edu",
    password: "testpass123",
    name: "Marco Braun",
    studiengang: "Medientechnik",
    university: "Hochschule München",
  },

  // International Students
  {
    email: "elena.garcia@tum.de",
    password: "testpass123",
    name: "Elena García",
    studiengang: "International Master in Computer Science",
    university: "TU München",
  },
  {
    email: "ahmed.hassan@lmu.de",
    password: "testpass123",
    name: "Ahmed Hassan",
    studiengang: "International Business",
    university: "LMU München",
  },
  {
    email: "yuki.tanaka@tum.de",
    password: "testpass123",
    name: "Yuki Tanaka",
    studiengang: "Robotics",
    university: "TU München",
  },
];

const ENHANCED_TEST_PLACES = [
  // University Buildings - TUM
  {
    name: "TUM Informatik Hauptgebäude",
    location: {
      type: "coordinates",
      lat: 48.2625,
      lng: 11.6681,
      address: "Boltzmannstraße 3, Garching",
      city: "München",
    },
  },
  {
    name: "TUM Mensa Garching",
    location: {
      type: "coordinates",
      lat: 48.2649,
      lng: 11.6715,
      address: "Lichtenbergstraße 2, Garching",
      city: "München",
    },
  },
  {
    name: "TUM Bibliothek Garching",
    location: {
      type: "coordinates",
      lat: 48.2655,
      lng: 11.6702,
      address: "Universitätsbibliothek Garching",
      city: "München",
    },
  },

  // University Buildings - LMU
  {
    name: "LMU Hauptgebäude",
    location: {
      type: "coordinates",
      lat: 48.15,
      lng: 11.5806,
      address: "Geschwister-Scholl-Platz 1",
      city: "München",
    },
  },
  {
    name: "LMU Mensa Leopoldstraße",
    location: {
      type: "coordinates",
      lat: 48.1556,
      lng: 11.5814,
      address: "Leopoldstraße 13a",
      city: "München",
    },
  },
  {
    name: "LMU Juristische Bibliothek",
    location: {
      type: "coordinates",
      lat: 48.1489,
      lng: 11.5797,
      address: "Professor-Huber-Platz 2",
      city: "München",
    },
  },

  // Popular Student Hangouts
  {
    name: "Café Münchner Freiheit",
    location: {
      type: "coordinates",
      lat: 48.1621,
      lng: 11.5877,
      address: "Münchner Freiheit 20",
      city: "München",
    },
  },
  {
    name: "Augustiner Bräu",
    location: {
      type: "coordinates",
      lat: 48.1439,
      lng: 11.5581,
      address: "Neuhauserstraße 27",
      city: "München",
    },
  },
  {
    name: "Englischer Garten - Chinesischer Turm",
    location: {
      type: "coordinates",
      lat: 48.164,
      lng: 11.5939,
      address: "Englischer Garten 3",
      city: "München",
    },
  },
  {
    name: "Isar Beach Bar",
    location: {
      type: "coordinates",
      lat: 48.128,
      lng: 11.5893,
      address: "Zenneckbrücke, Isar",
      city: "München",
    },
  },

  // Study Spots
  {
    name: "Bayerische Staatsbibliothek",
    location: {
      type: "coordinates",
      lat: 48.1429,
      lng: 11.5819,
      address: "Ludwigstraße 16",
      city: "München",
    },
  },
  {
    name: "Starbucks Maximilianstraße",
    location: {
      type: "coordinates",
      lat: 48.1404,
      lng: 11.5849,
      address: "Maximilianstraße 8",
      city: "München",
    },
  },
  {
    name: "Co-Working Space Rocket Internet",
    location: {
      type: "coordinates",
      lat: 48.1467,
      lng: 11.5721,
      address: "Sandstraße 33",
      city: "München",
    },
  },

  // Sports & Recreation
  {
    name: "Hochschulsport TUM",
    location: {
      type: "coordinates",
      lat: 48.2611,
      lng: 11.6689,
      address: "Georg-Brauchle-Ring 60/62, Garching",
      city: "München",
    },
  },
  {
    name: "Olympiapark",
    location: {
      type: "coordinates",
      lat: 48.1755,
      lng: 11.5545,
      address: "Spiridon-Louis-Ring 21",
      city: "München",
    },
  },
  {
    name: "Boulder Lounge",
    location: {
      type: "coordinates",
      lat: 48.139,
      lng: 11.5563,
      address: "Boulderwelt München",
      city: "München",
    },
  },

  // Student Housing
  {
    name: "Studentenwohnheim Garching",
    location: {
      type: "coordinates",
      lat: 48.2734,
      lng: 11.6522,
      address: "Lichtenbergstraße 8, Garching",
      city: "München",
    },
  },
  {
    name: "Studentenstadt Freimann",
    location: {
      type: "coordinates",
      lat: 48.1889,
      lng: 11.6047,
      address: "Christoph-Probst-Straße 10",
      city: "München",
    },
  },

  // Tech & Innovation Hubs
  {
    name: "Google Office München",
    location: {
      type: "coordinates",
      lat: 48.1392,
      lng: 11.5653,
      address: "Erika-Mann-Straße 33",
      city: "München",
    },
  },
  {
    name: "Microsoft Office München",
    location: {
      type: "coordinates",
      lat: 48.2078,
      lng: 11.6647,
      address: "Walter-Gropius-Straße 5, Unterschleißheim",
      city: "München",
    },
  },

  // Weekend Spots
  {
    name: "Viktualienmarkt",
    location: {
      type: "coordinates",
      lat: 48.1351,
      lng: 11.5761,
      address: "Viktualienmarkt 3",
      city: "München",
    },
  },
  {
    name: "Marienplatz",
    location: {
      type: "coordinates",
      lat: 48.1374,
      lng: 11.5755,
      address: "Marienplatz 1",
      city: "München",
    },
  },
];

function generateRandomTime(daysBack = 30) {
  const now = new Date();
  const pastTime = new Date(
    now.getTime() - Math.random() * daysBack * 24 * 60 * 60 * 1000
  );
  return pastTime.toISOString();
}

function generateFutureTime(daysAhead = 7) {
  const now = new Date();
  const futureTime = new Date(
    now.getTime() + Math.random() * daysAhead * 24 * 60 * 60 * 1000
  );
  return futureTime.toISOString();
}

async function clearExistingTestData() {
  console.log("🧹 Clearing existing test data...");

  try {
    // Get test user IDs (looking for both @example.com and university emails)
    const { data: testUsers } = await supabase.auth.admin.listUsers();
    const testUserIds = testUsers.users
      .filter(
        (user) =>
          user.email &&
          (user.email.includes("@example.com") ||
            user.email.includes("@tum.de") ||
            user.email.includes("@lmu.de") ||
            user.email.includes("@hm.edu"))
      )
      .map((user) => user.id);

    if (testUserIds.length === 0) {
      console.log("   No existing test users found");
      return;
    }

    // Delete activities, friendships, invites, and profiles
    await supabase.from("activities").delete().in("user_id", testUserIds);
    await supabase
      .from("friendship_invites")
      .delete()
      .or(
        `requester_id.in.(${testUserIds.join(
          ","
        )}),requestee_id.in.(${testUserIds.join(",")})`
      );
    await supabase
      .from("friendships")
      .delete()
      .or(
        `user1_id.in.(${testUserIds.join(",")}),user2_id.in.(${testUserIds.join(
          ","
        )})`
      );
    await supabase.from("profiles").delete().in("user_id", testUserIds);

    // Delete test places
    const placeNames = ENHANCED_TEST_PLACES.map((p) => p.name);
    await supabase.from("places").delete().in("name", placeNames);

    // Delete test users from auth
    for (const userId of testUserIds) {
      await supabase.auth.admin.deleteUser(userId);
    }

    console.log(
      `   Deleted ${testUserIds.length} test users and associated data`
    );
  } catch (error) {
    console.error("   Error clearing test data:", error.message);
  }
}

async function createTestUsers() {
  console.log("👤 Creating enhanced test users...");
  const createdUsers = [];

  for (const userData of ENHANCED_TEST_USERS) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
      });

      if (error) {
        console.error(
          `   ❌ Failed to create user ${userData.email}:`,
          error.message
        );
        continue;
      }

      createdUsers.push({ ...userData, id: data.user.id });
      console.log(`   ✅ Created user: ${userData.email}`);
    } catch (error) {
      console.error(
        `   ❌ Error creating user ${userData.email}:`,
        error.message
      );
    }
  }

  console.log(
    `   Created ${createdUsers.length}/${ENHANCED_TEST_USERS.length} users`
  );
  return createdUsers;
}

async function createTestPlaces() {
  console.log("📍 Creating enhanced test places...");

  const { data, error } = await supabase
    .from("places")
    .insert(ENHANCED_TEST_PLACES)
    .select();

  if (error) {
    console.error("   ❌ Failed to create places:", error.message);
    return [];
  }

  console.log(`   ✅ Created ${data.length} places`);
  return data;
}

async function createTestProfiles(users) {
  console.log("📝 Creating test profiles...");

  const profiles = users.map((user) => ({
    name: user.name,
    studiengang: user.studiengang,
    university: user.university,
    user_id: user.id,
  }));

  const { data, error } = await supabase
    .from("profiles")
    .insert(profiles)
    .select();

  if (error) {
    console.error("   ❌ Failed to create profiles:", error.message);
    return [];
  }

  console.log(`   ✅ Created ${data.length} profiles`);
  return data;
}

async function createTestActivities(users, places) {
  console.log("🎯 Creating diverse test activities...");

  const activities = [];

  // Create activities for each user with realistic patterns
  users.forEach((user) => {
    const activityCount = 3 + Math.floor(Math.random() * 5); // 3-7 activities per user
    const userPlaces = new Set(); // Avoid duplicate places for same user on same day

    for (let i = 0; i < activityCount; i++) {
      const randomPlace = places[Math.floor(Math.random() * places.length)];

      // Mix of past and future activities
      const timeFunc =
        Math.random() < 0.7 ? generateRandomTime : generateFutureTime;
      const time = timeFunc(Math.random() < 0.5 ? 7 : 30); // Recent or older

      activities.push({
        user_id: user.id,
        place_id: randomPlace.place_id,
        time: time,
      });
    }
  });

  const { data, error } = await supabase
    .from("activities")
    .insert(activities)
    .select();

  if (error) {
    console.error("   ❌ Failed to create activities:", error.message);
    return [];
  }

  console.log(`   ✅ Created ${data.length} activities`);
  return data;
}

async function createTestFriendships(users) {
  console.log("👥 Creating realistic friendship networks...");

  const friendships = [];

  // Create friendship clusters based on universities and study programs
  const tumStudents = users.filter((u) => u.university === "TU München");
  const lmuStudents = users.filter((u) => u.university === "LMU München");
  const hmStudents = users.filter((u) => u.university === "Hochschule München");

  // Higher friendship probability within same university
  function createFriendshipsInGroup(group, probability = 0.4) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (Math.random() < probability) {
          friendships.push({
            user1_id: group[i].id,
            user2_id: group[j].id,
          });
        }
      }
    }
  }

  // Create within-university friendships
  createFriendshipsInGroup(tumStudents, 0.4);
  createFriendshipsInGroup(lmuStudents, 0.4);
  createFriendshipsInGroup(hmStudents, 0.5); // Smaller group, higher probability

  // Cross-university friendships (lower probability)
  const allPairs = [];
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      if (users[i].university !== users[j].university && Math.random() < 0.15) {
        allPairs.push({
          user1_id: users[i].id,
          user2_id: users[j].id,
        });
      }
    }
  }

  friendships.push(...allPairs);

  if (friendships.length === 0) {
    console.log("   No friendships to create");
    return [];
  }

  const { data, error } = await supabase
    .from("friendships")
    .insert(friendships)
    .select();

  if (error) {
    console.error("   ❌ Failed to create friendships:", error.message);
    return [];
  }

  console.log(`   ✅ Created ${data.length} friendships`);
  return data;
}

async function createTestFriendshipInvites(users, existingFriendships) {
  console.log("📨 Creating diverse friendship invites...");

  const invites = [];
  const friendPairs = new Set();

  // Track existing friendships
  existingFriendships.forEach((f) => {
    friendPairs.add(`${f.user1_id}-${f.user2_id}`);
    friendPairs.add(`${f.user2_id}-${f.user1_id}`);
  });

  // Create various types of invites
  for (let i = 0; i < users.length; i++) {
    const requester = users[i];

    // Each user might send 1-3 invites
    const inviteCount = Math.floor(Math.random() * 3) + 1;
    let invitesSent = 0;

    for (let j = 0; j < users.length && invitesSent < inviteCount; j++) {
      if (i === j) continue;

      const requestee = users[j];
      const pairKey = `${requester.id}-${requestee.id}`;

      if (!friendPairs.has(pairKey) && Math.random() < 0.15) {
        // Determine invite status with realistic distribution
        let status;
        const rand = Math.random();
        if (rand < 0.6) status = "pending"; // 60% pending
        else if (rand < 0.85)
          status = "accepted"; // 25% accepted (but not yet friendship)
        else status = "rejected"; // 15% rejected

        invites.push({
          requester_id: requester.id,
          requestee_id: requestee.id,
          status: status,
        });

        friendPairs.add(pairKey);
        friendPairs.add(`${requestee.id}-${requester.id}`);
        invitesSent++;
      }
    }
  }

  if (invites.length === 0) {
    console.log("   No invites to create");
    return [];
  }

  const { data, error } = await supabase
    .from("friendship_invites")
    .insert(invites)
    .select();

  if (error) {
    console.error("   ❌ Failed to create friendship invites:", error.message);
    return [];
  }

  console.log(`   ✅ Created ${data.length} friendship invites`);

  // Log status distribution
  const statusCounts = invites.reduce((acc, invite) => {
    acc[invite.status] = (acc[invite.status] || 0) + 1;
    return acc;
  }, {});
  console.log(`   Status distribution:`, statusCounts);

  return data;
}

function printSummaryStatistics(
  users,
  places,
  profiles,
  activities,
  friendships,
  invites
) {
  console.log("\n📊 Enhanced Data Summary:");
  console.log(`   Users: ${users.length}`);
  console.log(`   Places: ${places.length}`);
  console.log(`   Profiles: ${profiles.length}`);
  console.log(`   Activities: ${activities.length}`);
  console.log(`   Friendships: ${friendships.length}`);
  console.log(`   Friendship Invites: ${invites.length}`);

  // University distribution
  const uniCounts = users.reduce((acc, user) => {
    acc[user.university] = (acc[user.university] || 0) + 1;
    return acc;
  }, {});
  console.log("\n🏫 University Distribution:");
  Object.entries(uniCounts).forEach(([uni, count]) => {
    console.log(`   ${uni}: ${count} students`);
  });

  // Place categories
  const placeCounts = {
    University: places.filter(
      (p) =>
        p.name.includes("TUM") ||
        p.name.includes("LMU") ||
        p.name.includes("Bibliothek") ||
        p.name.includes("Mensa")
    ).length,
    Social: places.filter(
      (p) =>
        p.name.includes("Café") ||
        p.name.includes("Augustiner") ||
        p.name.includes("Bar")
    ).length,
    Study: places.filter(
      (p) =>
        p.name.includes("Starbucks") ||
        p.name.includes("Co-Working") ||
        p.name.includes("Staatsbibliothek")
    ).length,
    Recreation: places.filter(
      (p) =>
        p.name.includes("Park") ||
        p.name.includes("Sport") ||
        p.name.includes("Boulder")
    ).length,
    Other:
      places.length -
      places.filter(
        (p) =>
          p.name.includes("TUM") ||
          p.name.includes("LMU") ||
          p.name.includes("Bibliothek") ||
          p.name.includes("Mensa") ||
          p.name.includes("Café") ||
          p.name.includes("Augustiner") ||
          p.name.includes("Bar") ||
          p.name.includes("Starbucks") ||
          p.name.includes("Co-Working") ||
          p.name.includes("Staatsbibliothek") ||
          p.name.includes("Park") ||
          p.name.includes("Sport") ||
          p.name.includes("Boulder")
      ).length,
  };

  console.log("\n📍 Place Categories:");
  Object.entries(placeCounts).forEach(([category, count]) => {
    console.log(`   ${category}: ${count} places`);
  });
}

async function main() {
  console.log("🚀 Starting enhanced database seeding...\n");

  try {
    // Clear existing test data
    await clearExistingTestData();

    // Create new test data
    const users = await createTestUsers();
    if (users.length === 0) {
      console.error("❌ No users were created. Aborting.");
      return;
    }

    const places = await createTestPlaces();
    const profiles = await createTestProfiles(users);
    const activities = await createTestActivities(users, places);
    const friendships = await createTestFriendships(users);
    const invites = await createTestFriendshipInvites(users, friendships);

    console.log("\n🎉 Enhanced database seeding completed successfully!");

    printSummaryStatistics(
      users,
      places,
      profiles,
      activities,
      friendships,
      invites
    );

    console.log("\n🔑 Sample test user credentials:");
    console.log("   Email: max.mueller@tum.de");
    console.log("   Password: testpass123");
    console.log("   (All test users have the same password)");

    console.log("\n🏢 Universities represented:");
    console.log("   • TU München (Technical University)");
    console.log("   • LMU München (Ludwig-Maximilians-Universität)");
    console.log("   • Hochschule München (University of Applied Sciences)");
  } catch (error) {
    console.error("❌ Error during enhanced seeding:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
