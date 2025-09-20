/**
 * Database seeding script for development environment
 * This script creates test users through Supabase auth and populates the database with test data
 *
 * Usage:
 * 1. Make sure you have SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local
 * 2. Run: npm run seed or node scripts/seed-database.js
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

// Test data
const TEST_USERS = [
  {
    email: "max.mueller@example.com",
    password: "testpass123",
    name: "Max Müller",
    studiengang: "Informatik",
    university: "TU München",
  },
  {
    email: "anna.schmidt@example.com",
    password: "testpass123",
    name: "Anna Schmidt",
    studiengang: "Maschinenbau",
    university: "TU München",
  },
  {
    email: "david.fischer@example.com",
    password: "testpass123",
    name: "David Fischer",
    studiengang: "Elektrotechnik",
    university: "TU München",
  },
  {
    email: "julia.weber@example.com",
    password: "testpass123",
    name: "Julia Weber",
    studiengang: "BWL",
    university: "LMU München",
  },
  {
    email: "felix.meyer@example.com",
    password: "testpass123",
    name: "Felix Meyer",
    studiengang: "Informatik",
    university: "TU München",
  },
  {
    email: "laura.wagner@example.com",
    password: "testpass123",
    name: "Laura Wagner",
    studiengang: "Psychologie",
    university: "LMU München",
  },
  {
    email: "leon.becker@example.com",
    password: "testpass123",
    name: "Leon Becker",
    studiengang: "Jura",
    university: "LMU München",
  },
  {
    email: "emma.schulz@example.com",
    password: "testpass123",
    name: "Emma Schulz",
    studiengang: "Medizin",
    university: "LMU München",
  },
];

const TEST_PLACES = [
  {
    name: "Universitätsbibliothek",
    location: {
      type: "coordinates",
      lat: 48.1351,
      lng: 11.582,
      address: "Universitätsbibliothek, München",
      city: "München",
    },
  },
  {
    name: "Mensa Zentral",
    location: {
      type: "coordinates",
      lat: 48.1372,
      lng: 11.5756,
      address: "Mensa Zentral, München",
      city: "München",
    },
  },
  {
    name: "Campus Café",
    location: {
      type: "coordinates",
      lat: 48.1389,
      lng: 11.5831,
      address: "Campus Café, München",
      city: "München",
    },
  },
  {
    name: "Studentenwohnheim Nord",
    location: {
      type: "coordinates",
      lat: 48.1445,
      lng: 11.5687,
      address: "Studentenwohnheim Nord, München",
      city: "München",
    },
  },
  {
    name: "Hörsaal A",
    location: {
      type: "coordinates",
      lat: 48.1356,
      lng: 11.5804,
      address: "Hörsaal A, München",
      city: "München",
    },
  },
  {
    name: "Labor 3.14",
    location: {
      type: "coordinates",
      lat: 48.1367,
      lng: 11.5812,
      address: "Labor 3.14, München",
      city: "München",
    },
  },
  {
    name: "Audimax",
    location: {
      type: "coordinates",
      lat: 48.1378,
      lng: 11.5789,
      address: "Audimax, München",
      city: "München",
    },
  },
  {
    name: "Sportplatz",
    location: {
      type: "coordinates",
      lat: 48.1423,
      lng: 11.5701,
      address: "Sportplatz, München",
      city: "München",
    },
  },
  {
    name: "Botanischer Garten",
    location: {
      type: "coordinates",
      lat: 48.1167,
      lng: 11.5056,
      address: "Botanischer Garten, München",
      city: "München",
    },
  },
  {
    name: "Fitness Studio Campus",
    location: {
      type: "coordinates",
      lat: 48.1401,
      lng: 11.5734,
      address: "Fitness Studio Campus, München",
      city: "München",
    },
  },
];

function generateRandomTime(daysBack = 7) {
  const now = new Date();
  const pastTime = new Date(
    now.getTime() - Math.random() * daysBack * 24 * 60 * 60 * 1000
  );
  return pastTime.toISOString();
}

async function clearExistingTestData() {
  console.log("🧹 Clearing existing test data...");

  try {
    // Get test user IDs
    const { data: testUsers } = await supabase.auth.admin.listUsers();
    const testUserIds = testUsers.users
      .filter((user) => user.email && user.email.includes("@example.com"))
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
    const placeNames = TEST_PLACES.map((p) => p.name);
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
  console.log("👤 Creating test users...");
  const createdUsers = [];

  for (const userData of TEST_USERS) {
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

  console.log(`   Created ${createdUsers.length}/${TEST_USERS.length} users`);
  return createdUsers;
}

async function createTestPlaces() {
  console.log("📍 Creating test places...");

  const { data, error } = await supabase
    .from("places")
    .insert(TEST_PLACES)
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
  console.log("🎯 Creating test activities...");

  const activities = [];

  // Create 2-3 activities per user
  users.forEach((user) => {
    const activityCount = 2 + Math.floor(Math.random() * 2); // 2-3 activities
    for (let i = 0; i < activityCount; i++) {
      const randomPlace = places[Math.floor(Math.random() * places.length)];
      activities.push({
        user_id: user.id,
        place_id: randomPlace.place_id,
        time: generateRandomTime(7),
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
  console.log("👥 Creating test friendships...");

  const friendships = [];

  // Create some friendships (about 30% of possible pairs)
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      if (Math.random() < 0.3) {
        friendships.push({
          user1_id: users[i].id,
          user2_id: users[j].id,
        });
      }
    }
  }

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
  console.log("📨 Creating test friendship invites...");

  const invites = [];
  const friendPairs = new Set();

  // Track existing friendships
  existingFriendships.forEach((f) => {
    friendPairs.add(`${f.user1_id}-${f.user2_id}`);
    friendPairs.add(`${f.user2_id}-${f.user1_id}`);
  });

  // Create some pending invites
  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < users.length; j++) {
      if (i !== j && Math.random() < 0.1) {
        // 10% chance
        const pairKey = `${users[i].id}-${users[j].id}`;
        if (!friendPairs.has(pairKey)) {
          invites.push({
            requester_id: users[i].id,
            requestee_id: users[j].id,
            status: Math.random() < 0.8 ? "pending" : "rejected",
          });
          friendPairs.add(pairKey);
          friendPairs.add(`${users[j].id}-${users[i].id}`);
        }
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
  return data;
}

async function main() {
  console.log("🚀 Starting database seeding...\n");

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

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   Users: ${users.length}`);
    console.log(`   Places: ${places.length}`);
    console.log(`   Profiles: ${profiles.length}`);
    console.log(`   Activities: ${activities.length}`);
    console.log(`   Friendships: ${friendships.length}`);
    console.log(`   Friendship Invites: ${invites.length}`);
    console.log("\n🔑 Test user credentials:");
    console.log("   Email: max.mueller@example.com");
    console.log("   Password: testpass123");
    console.log("   (All test users have the same password)");
  } catch (error) {
    console.error("❌ Error during seeding:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
