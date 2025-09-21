/**
 * Simple seeding script that uses the generated dummy data
 * This script can work with environment variables or you can modify it to use your Supabase setup
 */

const { generateAllDummyData } = require("./generate-dummy-data.js");
const fs = require("fs");
const path = require("path");

async function generateDummyDataFiles() {
  console.log("🎯 Generating dummy data files for Supabase...\n");

  const dummyData = generateAllDummyData();

  // Create SQL insert statements for easy import
  let sql = `-- Generated dummy data for Geländer app\n`;
  sql += `-- Generated on ${new Date().toISOString()}\n\n`;

  // Users (these would need to be created through Supabase Auth)
  sql += `-- USERS (Create through Supabase Auth Dashboard or API):\n`;
  dummyData.users.forEach((user) => {
    sql += `-- ${user.email} (password: ${user.password})\n`;
  });
  sql += `\n`;

  // Places
  sql += `-- PLACES\n`;
  sql += `INSERT INTO places (name, location) VALUES\n`;
  const placeValues = dummyData.places
    .map(
      (place) =>
        `('${place.name.replace(/'/g, "''")}', '${JSON.stringify(
          place.location
        ).replace(/'/g, "''")}')`
    )
    .join(",\n");
  sql += placeValues + ";\n\n";

  // Activities (with placeholder user_ids)
  sql += `-- ACTIVITIES (Replace user_id values with actual UUIDs from auth.users)\n`;
  sql += `-- Template for activities:\n`;
  dummyData.activities.forEach((activity, index) => {
    sql += `-- User: ${activity.user_email} at ${activity.place_name} on ${activity.time}\n`;
    sql += `-- INSERT INTO activities (user_id, place_id, time) VALUES ('[USER_UUID_${index}]', (SELECT place_id FROM places WHERE name = '${activity.place_name.replace(
      /'/g,
      "''"
    )}'), '${activity.time}');\n`;
  });
  sql += `\n`;

  // Friendship patterns (with placeholder user_ids)
  sql += `-- FRIENDSHIPS (Replace user_id values with actual UUIDs from auth.users)\n`;
  dummyData.friendships.forEach((friendship, index) => {
    sql += `-- Friendship between ${friendship.user1_name} (${friendship.user1_email}) and ${friendship.user2_name} (${friendship.user2_email})\n`;
    sql += `-- INSERT INTO friendships (user1_id, user2_id) VALUES ('[USER1_UUID_${index}]', '[USER2_UUID_${index}]');\n`;
  });
  sql += `\n`;

  // Friendship invites (with placeholder user_ids)
  sql += `-- FRIENDSHIP INVITES (Replace user_id values with actual UUIDs from auth.users)\n`;
  dummyData.invites.forEach((invite, index) => {
    sql += `-- Invite from ${invite.requester_name} (${invite.requester_email}) to ${invite.requestee_name} (${invite.requestee_email}) - Status: ${invite.status}\n`;
    sql += `-- INSERT INTO friendship_invites (requester_id, requestee_id, status, created_at) VALUES ('[REQUESTER_UUID_${index}]', '[REQUESTEE_UUID_${index}]', '${invite.status}', '${invite.created_at}');\n`;
  });

  // Save files
  const sqlPath = path.join(__dirname, "dummy-data.sql");
  const jsonPath = path.join(__dirname, "dummy-data.json");

  fs.writeFileSync(sqlPath, sql);
  fs.writeFileSync(jsonPath, JSON.stringify(dummyData, null, 2));

  console.log(`\n💾 Files generated:`);
  console.log(`   📄 SQL: ${sqlPath}`);
  console.log(`   📄 JSON: ${jsonPath}`);

  console.log(`\n🚀 Next Steps:`);
  console.log(
    `   1. Set up your Supabase environment variables in .env.local:`
  );
  console.log(`      NEXT_PUBLIC_SUPABASE_URL=your_supabase_url`);
  console.log(`      SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`);
  console.log(`   2. Run: npm run seed-enhanced (if env vars are set)`);
  console.log(`   3. Or manually import the generated SQL file into Supabase`);
  console.log(`   4. Or use the JSON data in your own seeding approach`);

  return dummyData;
}

if (require.main === module) {
  generateDummyDataFiles();
}

module.exports = { generateDummyDataFiles };
