import { PrismaClient, LogType } from '@prisma/client';
import { logMessage } from './logMessage';

const prisma = new PrismaClient();
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const CITY = process.env.CITY || "Toronto";
const PLACE_TYPES = ["library", "cafe", "coworking_space"];
const MAX_NEW_PLACES = 20;
const JOB_ID = 1;  // Static Job ID
const JOB_START_MESSAGE = "Fetch Places Job Started."

// Type definitions
interface GooglePlace {
  name: string;
  formatted_address: string;
  place_id: string;
  geometry: { location: { lat: number; lng: number } };
  photos?: { photo_reference: string }[];
  rating?: number;
  user_ratings_total?: number;
}

interface GooglePlacesAPIResponse {
  results: GooglePlace[];
  next_page_token?: string;
}

// Delay function for API pagination
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchPlaces(): Promise<void> {
  const alreadyInserted = new Set<string>(); // Track inserted place IDs
  let totalInserted = 0;

  if (await hasRunTooManyTimes()) {
    await logMessage("Script already ran ten times today. Exiting.", JOB_ID, LogType.SUCCESS);
    return;
  }

  await logMessage(JOB_START_MESSAGE, JOB_ID, LogType.SUCCESS);

  for (const type of PLACE_TYPES) {
    if (totalInserted >= MAX_NEW_PLACES) break;

    let nextPageToken: string | null = null;

    do {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${type}+in+${CITY}&key=${GOOGLE_API_KEY}`
        + (nextPageToken ? `&pagetoken=${nextPageToken}` : "");

      try {
        await delay(2000); // Wait before making the paginated request

        const response: Response = await fetch(url);
        if (!response.ok){
          const httpErrorMessage = `HTTP error! Status: ${response.status}`
          logMessage(httpErrorMessage, JOB_ID, LogType.ERROR)
          throw new Error(httpErrorMessage);
        } 

        const data: GooglePlacesAPIResponse = await response.json();
        const places: GooglePlace[] = data.results;
        nextPageToken = data.next_page_token || null; // Store next page token

        for (const place of places) {
          if (totalInserted >= MAX_NEW_PLACES) break;

          if (alreadyInserted.has(place.place_id)) continue;

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
                rating: place.rating || null,
                googleRatingsTotal: place.user_ratings_total || null,
              },
            });

            alreadyInserted.add(place.place_id);
            totalInserted++;

            await logMessage(`Inserted: ${place.name}, Google Place ID: ${place.place_id}`, JOB_ID, LogType.SUCCESS);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error has occurred";
        await logMessage(`Error fetching places for type ${type}: ${errorMessage}`, JOB_ID, LogType.ERROR);
        nextPageToken = null; // Stop further requests if an error occurs
      }
    } while (nextPageToken && totalInserted < MAX_NEW_PLACES);
  }

  await logMessage(`Finished fetching. Inserted ${totalInserted} new places.`, JOB_ID, LogType.SUCCESS);
  await prisma.$disconnect();
}

async function hasRunTooManyTimes(): Promise<boolean> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const count = await prisma.jobLog.count({
    where: { jobId: JOB_ID, createdAt: { gte: startOfDay }, message: JOB_START_MESSAGE},
  });

  return count >= 10;
}

fetchPlaces();