/**
 * Enhanced dummy data generator
 * This creates comprehensive test data as JSON files that can be imported or used with any seeding approach
 */

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

function generateFriendshipPatterns(users) {
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
            user1_email: group[i].email,
            user2_email: group[j].email,
            user1_name: group[i].name,
            user2_name: group[j].name,
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
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      if (users[i].university !== users[j].university && Math.random() < 0.15) {
        friendships.push({
          user1_email: users[i].email,
          user2_email: users[j].email,
          user1_name: users[i].name,
          user2_name: users[j].name,
        });
      }
    }
  }

  return friendships;
}

function generateFriendshipInvites(users, existingFriendships) {
  const invites = [];
  const friendPairs = new Set();

  // Track existing friendships
  existingFriendships.forEach((f) => {
    friendPairs.add(`${f.user1_email}-${f.user2_email}`);
    friendPairs.add(`${f.user2_email}-${f.user1_email}`);
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
      const pairKey = `${requester.email}-${requestee.email}`;

      if (!friendPairs.has(pairKey) && Math.random() < 0.15) {
        // Determine invite status with realistic distribution
        let status;
        const rand = Math.random();
        if (rand < 0.6) status = "pending"; // 60% pending
        else if (rand < 0.85)
          status = "accepted"; // 25% accepted (but not yet friendship)
        else status = "rejected"; // 15% rejected

        invites.push({
          requester_email: requester.email,
          requestee_email: requestee.email,
          requester_name: requester.name,
          requestee_name: requestee.name,
          status: status,
          created_at: generateRandomTime(14), // Invites from last 2 weeks
        });

        friendPairs.add(pairKey);
        friendPairs.add(`${requestee.email}-${requester.email}`);
        invitesSent++;
      }
    }
  }

  return invites;
}

function generateActivities(users, places) {
  const activities = [];

  // Create activities for each user with realistic patterns
  users.forEach((user) => {
    const activityCount = 3 + Math.floor(Math.random() * 5); // 3-7 activities per user

    for (let i = 0; i < activityCount; i++) {
      const randomPlace = places[Math.floor(Math.random() * places.length)];

      // Mix of past and future activities
      const timeFunc =
        Math.random() < 0.7 ? generateRandomTime : generateFutureTime;
      const time = timeFunc(Math.random() < 0.5 ? 7 : 30); // Recent or older

      activities.push({
        user_email: user.email,
        user_name: user.name,
        place_name: randomPlace.name,
        place_address: randomPlace.location.address,
        time: time,
      });
    }
  });

  return activities;
}

// Generate all the dummy data
function generateAllDummyData() {
  console.log("🎯 Generating comprehensive dummy data...\n");

  const users = ENHANCED_TEST_USERS;
  const places = ENHANCED_TEST_PLACES;
  const friendships = generateFriendshipPatterns(users);
  const invites = generateFriendshipInvites(users, friendships);
  const activities = generateActivities(users, places);

  const data = {
    users,
    places,
    friendships,
    invites,
    activities,
    metadata: {
      generated_at: new Date().toISOString(),
      total_users: users.length,
      total_places: places.length,
      total_friendships: friendships.length,
      total_invites: invites.length,
      total_activities: activities.length,
      universities: [...new Set(users.map((u) => u.university))],
      study_programs: [...new Set(users.map((u) => u.studiengang))],
    },
  };

  // Print summary
  console.log("📊 Generated Data Summary:");
  console.log(`   Users: ${data.metadata.total_users}`);
  console.log(`   Places: ${data.metadata.total_places}`);
  console.log(`   Friendships: ${data.metadata.total_friendships}`);
  console.log(`   Friendship Invites: ${data.metadata.total_invites}`);
  console.log(`   Activities: ${data.metadata.total_activities}`);

  // University distribution
  const uniCounts = users.reduce((acc, user) => {
    acc[user.university] = (acc[user.university] || 0) + 1;
    return acc;
  }, {});
  console.log("\n🏫 University Distribution:");
  Object.entries(uniCounts).forEach(([uni, count]) => {
    console.log(`   ${uni}: ${count} students`);
  });

  // Invite status distribution
  const statusCounts = invites.reduce((acc, invite) => {
    acc[invite.status] = (acc[invite.status] || 0) + 1;
    return acc;
  }, {});
  console.log("\n📨 Friendship Invite Status Distribution:");
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   ${status}: ${count} invites`);
  });

  return data;
}

// Export for use in other files
module.exports = {
  ENHANCED_TEST_USERS,
  ENHANCED_TEST_PLACES,
  generateAllDummyData,
  generateFriendshipPatterns,
  generateFriendshipInvites,
  generateActivities,
};

// If run directly, generate and save data
if (require.main === module) {
  const fs = require("fs");
  const path = require("path");

  const dummyData = generateAllDummyData();

  // Save to JSON file
  const outputPath = path.join(__dirname, "dummy-data.json");
  fs.writeFileSync(outputPath, JSON.stringify(dummyData, null, 2));

  console.log(`\n💾 Dummy data saved to: ${outputPath}`);
  console.log("\n🔑 Sample test user credentials:");
  console.log("   Email: max.mueller@tum.de");
  console.log("   Password: testpass123");
  console.log("   (All test users have the same password)");

  console.log("\n📋 You can now:");
  console.log("   1. Use this data with your existing seed script");
  console.log("   2. Import the JSON file into your database");
  console.log("   3. Use individual data arrays in your application");
}
