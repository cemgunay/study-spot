import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const CITY = process.env.CITY || "Toronto";
const PLACE_TYPES = ["library", "cafe", "coworking_space"];
const MAX_PLACES = 20;

const JOB_ID = 1;  // Static Job ID

// Define type for Place API response (simplified version)
interface GooglePlace {
  name: string;
  formatted_address: string;
  place_id: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: {
    photo_reference: string;
  }[];
  rating?: number;
  user_ratings_total?: number;
}

// Function to insert job log with foreign key to Job table
async function logMessage(message: string): Promise<void> {
  await prisma.jobLog.create({
    data: {
      message,
      createdAt: new Date(), // Insert the current time as createdAt
      jobId: JOB_ID, // Use static jobId = 1 for this job
    },
  });
}

// Check if the script has run too many times today (already ran twice)
async function hasRunTooManyTimes(): Promise<boolean> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const count = await prisma.jobLog.count({
    where: { jobId: JOB_ID, createdAt: { gte: startOfDay } },
  });

  return count >= 2;
}

// Main function to fetch places from Google API and insert into DB
async function fetchPlaces(): Promise<void> {
  // We are assuming jobId = 1 is already created manually, so no need to check for job creation
  if (await hasRunTooManyTimes()) {
    await logMessage("Script already ran twice today. Exiting.");
    return;
  }

  await logMessage("Script started. Fetching study spots.");

  let totalInserted = 0;

  for (const type of PLACE_TYPES) {
    if (totalInserted >= MAX_PLACES) break;

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${type}+in+${CITY}&key=${GOOGLE_API_KEY}`;

    try {
      const response = await axios.get(url);
      const places: GooglePlace[] = response.data.results;

      for (const place of places) {
        if (totalInserted >= MAX_PLACES) break;

        const exists = await prisma.location.findUnique({
          where: { googlePlaceId: place.place_id },
        });

        if (!exists) {
          await prisma.location.create({
            data: {
              name: place.name,
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
              category: type,
              address: place.formatted_address,
              googlePlaceId: place.place_id,
              profilePicture: place.photos?.[0]
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
                : null,
              rating: place.rating || null, // Store rating (if available)
              googleRatingsTotal: place.user_ratings_total || null, // Store total ratings (if available)
            },
          });

          await logMessage(
            `Inserted: ${place.name} (Rating: ${place.rating || "N/A"}, Reviews: ${place.user_ratings_total || 0})`
          );
          totalInserted++;
        } else {
          await logMessage(`Already exists: ${place.name}`);
        }
      }
    } catch (error) {
      if(error instanceof Error){
        await logMessage(`Error fetching places for type ${type}: ${error.message}`);
      }
      else {
        await logMessage(`Unkown error occured when fetching new places`);
      }
    }
  }

  await logMessage(`Finished fetching. Inserted ${totalInserted} new places.`);
  await prisma.$disconnect();
}

fetchPlaces();