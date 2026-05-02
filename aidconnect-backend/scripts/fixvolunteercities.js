// scripts/fixVolunteerCities.js
// ─────────────────────────────────────────────────────────────────────────────
// ONE-TIME MIGRATION — run once, then delete this file.
//
// Purpose: Volunteers who registered before the city-seeding fix have
// serviceArea.city = null. This script looks up each such volunteer's
// User document and copies user.location.city → volunteer.serviceArea.city.
//
// Run with:
//   node scripts/fixVolunteerCities.js
//
// Safe to run multiple times — skips volunteers who already have a city.
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import User from "../models/User.model.js";
import Volunteer from "../models/Volunteer.model.js";

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  // Find all volunteers missing a city
  const broken = await Volunteer.find({
    $or: [
      { "serviceArea.city": null },
      { "serviceArea.city": "" },
      { "serviceArea.city": { $exists: false } },
    ],
  }).populate("user", "name email location");

  console.log(`Found ${broken.length} volunteer(s) with no city set.\n`);

  let fixed    = 0;
  let skipped  = 0;

  for (const vol of broken) {
    const city = vol.user?.location?.city;

    if (!city) {
      console.log(`⚠️  SKIP  ${vol.user?.email || vol._id} — user has no city in location either`);
      skipped++;
      continue;
    }

    vol.serviceArea      = vol.serviceArea || {};
    vol.serviceArea.city = city.trim();
    await vol.save();

    console.log(`✅ FIXED ${vol.user?.email} → city set to "${city}"`);
    fixed++;
  }

  console.log(`\nDone. Fixed: ${fixed} | Skipped (no city data): ${skipped}`);
  console.log("\nFor skipped volunteers, ask them to set their city in their profile.");

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});