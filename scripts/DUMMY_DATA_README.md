# Dummy Data Guide for Geländer App

This directory contains comprehensive dummy data generation scripts for the Geländer app's Supabase database.

## 📁 Files Overview

### Scripts

- **`generate-dummy-data.js`** - Core data generation script, creates realistic dummy data
- **`setup-dummy-data.js`** - Generates SQL and JSON files for easy import
- **`seed-enhanced.js`** - Full Supabase seeding script (requires environment variables)
- **`seed-database.js`** - Original seeding script

### Generated Files

- **`dummy-data.json`** - Complete data set in JSON format
- **`dummy-data.sql`** - SQL statements for manual import

## 🎯 Generated Data

### Users (21 total)

- **TU München (10 students)**: Computer Science, Engineering, Physics
- **LMU München (7 students)**: Business, Law, Medicine, Psychology, Biology, History
- **Hochschule München (4 students)**: Applied Sciences, Design, Media Technology

### Places (22 total)

- University buildings (TUM Garching, LMU central)
- Student hangouts (cafés, beer gardens, Englischer Garten)
- Study spots (libraries, co-working spaces)
- Sports & recreation facilities
- Tech company offices
- Popular Munich landmarks

### Relationships

- **Friendships**: Realistic patterns based on university affiliation
- **Friendship Invites**: Mix of pending, accepted, and rejected invites
- **Activities**: Users visiting various places with past and future timestamps

## 🚀 Usage Options

### Option 1: Quick Data Generation

```bash
npm run generate-dummy-data
```

Generates `dummy-data.json` with all test data.

### Option 2: SQL + JSON Files

```bash
npm run setup-dummy-data
```

Generates both SQL and JSON files for flexible import options.

### Option 3: Full Supabase Seeding (Requires Setup)

```bash
npm run seed-enhanced
```

Directly seeds your Supabase database (requires environment variables).

## ⚙️ Environment Setup

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📊 Data Statistics

| Category    | Count    | Details                                 |
| ----------- | -------- | --------------------------------------- |
| Users       | 21       | Diverse universities and study programs |
| Places      | 22       | Munich locations relevant to students   |
| Friendships | ~45-60   | University-based clustering             |
| Invites     | ~25-35   | Realistic status distribution           |
| Activities  | ~100-120 | 3-7 activities per user                 |

## 🔑 Test Credentials

All test users use the same password for easy testing:

- **Email**: `max.mueller@tum.de` (or any from the list)
- **Password**: `testpass123`

## 📋 Sample Users

### TU München

- Max Müller (`max.mueller@tum.de`) - Informatik
- Anna Schmidt (`anna.schmidt@tum.de`) - Computational Science
- David Fischer (`david.fischer@tum.de`) - Data Engineering
- Julia Weber (`julia.weber@tum.de`) - Maschinenbau
- Felix Meyer (`felix.meyer@tum.de`) - Elektrotechnik

### LMU München

- Sophia Richter (`sophia.richter@lmu.de`) - BWL
- Noah Zimmermann (`noah.zimmermann@lmu.de`) - Jura
- Mia Hoffmann (`mia.hoffmann@lmu.de`) - Medizin

### Hochschule München

- Sara Lange (`sara.lange@hm.edu`) - Angewandte Informatik
- Jan Klein (`jan.klein@hm.edu`) - Wirtschaftsinformatik

## 🏢 Featured Places

### University Locations

- TUM Informatik Hauptgebäude (Garching)
- TUM Mensa Garching
- LMU Hauptgebäude (Geschwister-Scholl-Platz)
- LMU Mensa Leopoldstraße

### Student Life

- Englischer Garten - Chinesischer Turm
- Augustiner Bräu
- Café Münchner Freiheit
- Isar Beach Bar

### Study Spots

- Bayerische Staatsbibliothek
- Starbucks Maximilianstraße
- Co-Working Space Rocket Internet

### Recreation

- Olympiapark
- Boulder Lounge
- Hochschulsport TUM

## 🔄 Data Relationships

### Friendship Patterns

- **Within University**: 40-50% connection rate
- **Cross University**: 15% connection rate
- **Study Program Clusters**: Computer Science students have higher connectivity

### Activity Patterns

- **Frequency**: 3-7 activities per user
- **Time Distribution**: 70% past activities, 30% future plans
- **Location Preference**: University-affiliated places are more common

### Invite Status Distribution

- **Pending**: ~60% (realistic for active social networks)
- **Accepted**: ~25% (some may become friendships)
- **Rejected**: ~15% (realistic rejection rate)

## 🛠️ Customization

To modify the data:

1. **Add Users**: Edit `ENHANCED_TEST_USERS` in `generate-dummy-data.js`
2. **Add Places**: Edit `ENHANCED_TEST_PLACES` in `generate-dummy-data.js`
3. **Adjust Relationships**: Modify probability values in `generateFriendshipPatterns()`
4. **Change Activity Patterns**: Adjust ranges in `generateActivities()`

## 📈 Testing Scenarios

The dummy data supports testing:

- **User Authentication**: Login with any test user
- **Social Features**: Friend requests, acceptances, rejections
- **Location Tracking**: Users at various Munich locations
- **University Networks**: Different social clusters
- **Activity Patterns**: Past and future activities
- **Cross-Platform Integration**: International students

## 🐛 Troubleshooting

### Missing Environment Variables

If seeding fails with missing env vars:

1. Create `.env.local` with Supabase credentials
2. Or use the JSON/SQL files for manual import

### Supabase Connection Issues

1. Check your Supabase project URL and service role key
2. Ensure your database schema matches the expected tables
3. Check Supabase dashboard for any connection issues

### Data Import Issues

1. For SQL import: Use Supabase SQL editor
2. For programmatic import: Use the JSON data with your preferred method
3. Check foreign key constraints match your schema

## 💡 Tips

- Use the JSON data for unit tests
- SQL files for quick database resets
- Enhanced seeding for full development environment
- Mix and match approaches based on your workflow
