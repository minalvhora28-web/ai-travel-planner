
import { NextResponse } from "next/server";

type DayBudget = {
  stay: number;
  food: number;
  activities: number;
  transport: number;
  total: number;
};

type DayPlan = {
  day: number;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
  food: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  budget: DayBudget;
};

type RealPlace = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
};

function cleanAIResponse(text: string) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

async function geocodeDestination(
  destination: string,
  apiKey: string
) {
  const cleanedDestination = destination
  .replace(/\s+near\s+.+$/i, "")
  .trim();

const searchText = `${cleanedDestination}`;

  const params = new URLSearchParams({
    text: searchText,
    format: "json",
    limit: "10",
    bias: "countrycode:none",
  apiKey: process.env.GEOAPIFY_API_KEY!,
    apiKey,
  });

  const url =
    `https://api.geoapify.com/v1/geocode/search?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "Geoapify geocoding error:",
      JSON.stringify(data, null, 2)
    );

    throw new Error(
      data?.message ||
        data?.error ||
        "Geoapify could not find the destination."
    );
  }

  if (
    !Array.isArray(data?.results) ||
    data.results.length === 0
  ) {
    throw new Error(
      `Could not find a real location for "${destination}".`
    );
  }

  console.log(
    "Geoapify geocoding candidates:",
    data.results
  );

  const normalizedDestination =
  cleanedDestination.toLowerCase().trim();

  const result =
  data.results.find((item: any) => {
    const city = String(item.city || "")
      .toLowerCase()
      .trim();

    const name = String(item.name || "")
      .toLowerCase()
      .trim();

    const country = String(item.country || "")
      .toLowerCase()
      .trim();

    return (
      city === normalizedDestination ||
      name === normalizedDestination
    );
  }) || data.results[0];

  const latitude = Number(result.lat);
  const longitude = Number(result.lon);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    throw new Error(
      "Geoapify returned an invalid location."
    );
  }

  return {
    name:
      result.city ||
      result.name ||
      destination,

    address:
      result.formatted ||
      result.address_line1 ||
      destination,

    latitude,
    longitude,
  };
}

async function findPlaces(
  latitude: number,
  longitude: number,
  apiKey: string
) {
  const categories = [
    "catering.restaurant",
    "accommodation.hotel",
    "accommodation.guest_house",
    "accommodation.hostel",
    "tourism.attraction",
    "tourism.sights",
    "leisure.park",
  ].join(",");

  const params = new URLSearchParams({
    categories,
    filter: `circle:${longitude},${latitude},30000`,
    bias: `proximity:${longitude},${latitude}`,
    limit: "50",
    lang: "en",
    apiKey,
  });

  const url =
    `https://api.geoapify.com/v2/places?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "Geoapify places error:",
      JSON.stringify(data, null, 2)
    );

    throw new Error(
      data?.message ||
        data?.error ||
        "Geoapify could not find nearby places."
    );
  }

  const features = Array.isArray(data?.features)
    ? data.features
    : [];

  const places: RealPlace[] = features
    .map((feature: any) => {
      const properties =
        feature?.properties || {};

      const coordinates =
        feature?.geometry?.coordinates || [];

      const latitudeValue =
        properties.lat ??
        coordinates[1];

      const longitudeValue =
        properties.lon ??
        coordinates[0];

      const categoriesFromAPI =
        Array.isArray(properties.categories)
          ? properties.categories
          : [];

      const name =
        properties.name ||
        properties.address_line1 ||
        "";

      const address =
        properties.formatted ||
        properties.address_line2 ||
        properties.address_line1 ||
        "";

      return {
        name,
        address,
        latitude: Number(latitudeValue),
        longitude: Number(longitudeValue),
        category: categoriesFromAPI.join(","),
      };
    })
    .filter(
      (place: RealPlace) =>
        place.name &&
        Number.isFinite(place.latitude) &&
        Number.isFinite(place.longitude)
    );

  const uniquePlaces = places.filter(
    (place, index, array) =>
      array.findIndex(
        (item) =>
          item.name.toLowerCase() ===
          place.name.toLowerCase()
      ) === index
  );

  const restaurants = uniquePlaces
    .filter((place) =>
      place.category.includes(
        "catering.restaurant"
      )
    )
    .slice(0, 10);

  const stays = uniquePlaces
    .filter(
      (place) =>
        place.category.includes(
          "accommodation.hotel"
        ) ||
        place.category.includes(
          "accommodation.guest_house"
        ) ||
        place.category.includes(
          "accommodation.hostel"
        )
    )
    .slice(0, 10);

  const attractions = uniquePlaces
    .filter(
      (place) =>
        place.category.includes(
          "tourism.attraction"
        ) ||
        place.category.includes(
          "tourism.sights"
        ) ||
        place.category.includes(
          "leisure.park"
        )
    )
    .slice(0, 15);

  return {
    restaurants,
    stays,
    attractions,
  };
}

function makePlaceText(
  title: string,
  places: RealPlace[]
) {
  if (places.length === 0) {
    return `${title}:\nNo real places were found.`;
  }

  return `${title}:\n${places
    .map(
      (place) =>
        `- ${place.name} | ${place.address} | ${place.latitude}, ${place.longitude}`
    )
    .join("\n")}`;
}

export async function POST(request: Request) {
  try {
    const HF_TOKEN = process.env.HF_TOKEN;
    const GEOAPIFY_API_KEY =
      process.env.GEOAPIFY_API_KEY;

    if (!HF_TOKEN) {
      return NextResponse.json(
        {
          error:
            "HF_TOKEN is missing in .env.local",
        },
        { status: 500 }
      );
    }

    if (!GEOAPIFY_API_KEY) {
      return NextResponse.json(
        {
          error:
            "GEOAPIFY_API_KEY is missing in .env.local",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const destination = String(
      body.destination || ""
    ).trim();

    const budget = Number(body.budget);
    const days = Number(body.days);
    const travelers = Number(body.travelers);

    const interests = Array.isArray(
      body.interests
    )
      ? body.interests
      : [];

    if (!destination) {
      return NextResponse.json(
        {
          error:
            "Destination is required.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(days) ||
      days < 1 ||
      days > 30
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid number of days between 1 and 30.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(travelers) ||
      travelers < 1 ||
      travelers > 50
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid number of travelers between 1 and 50.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(budget) ||
      budget < 1000
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid budget.",
        },
        { status: 400 }
      );
    }

    console.log(
      "Finding destination with Geoapify..."
    );

    const location =
      await geocodeDestination(
        destination,
        GEOAPIFY_API_KEY
      );

    console.log(
      "Destination found:",
      location
    );

    console.log(
      "Finding real restaurants, stays and attractions..."
    );

    const places = await findPlaces(
      location.latitude,
      location.longitude,
      GEOAPIFY_API_KEY
    );

    console.log(
      "Places found:",
      {
        restaurants:
          places.restaurants.length,
        stays:
          places.stays.length,
        attractions:
          places.attractions.length,
      }
    );

    const distanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const earthRadius = 6371;

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLon =
    ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
};

const nearbyPlaces = places.attractions.map(
  (attraction) => {
    const nearestRestaurants =
      [...places.restaurants]
        .map((restaurant) => ({
          ...restaurant,
          distanceKm: distanceKm(
            attraction.latitude,
            attraction.longitude,
            restaurant.latitude,
            restaurant.longitude
          ),
        }))
        .sort(
          (a, b) =>
            a.distanceKm - b.distanceKm
        )
        .slice(0, 3);

    const nearestStays =
      [...places.stays]
        .map((stay) => ({
          ...stay,
          distanceKm: distanceKm(
            attraction.latitude,
            attraction.longitude,
            stay.latitude,
            stay.longitude
          ),
        }))
        .sort(
          (a, b) =>
            a.distanceKm - b.distanceKm
        )
        .slice(0, 3);

    return {
      attraction,
      nearestRestaurants,
      nearestStays,
    };
  }
);

    const interestText =
      interests.length > 0
        ? interests.join(", ")
        : "general sightseeing";

    const nearbyPlaceInformation =
  nearbyPlaces
    .map((item) => {
      const restaurants =
        item.nearestRestaurants
          .map(
            (restaurant) =>
              `- ${restaurant.name} (${restaurant.distanceKm.toFixed(
                1
              )} km away)`
          )
          .join("\n");

      const stays =
        item.nearestStays
          .map(
            (stay) =>
              `- ${stay.name} (${stay.distanceKm.toFixed(
                1
              )} km away)`
          )
          .join("\n");

      return `
ATTRACTION:
${item.attraction.name}

NEARBY RESTAURANTS:
${restaurants}

NEARBY STAYS:
${stays}
`;
    })
    .join("\n");

const realPlaceInformation = `
REAL RESTAURANTS
${makePlaceText(
  "Only use these places for breakfast, lunch, or dinner.",
  places.restaurants
)}

REAL HOTELS AND STAYS
${makePlaceText(
  "Only use these places for accommodation.",
  places.stays
)}

REAL ATTRACTIONS
${makePlaceText(
  "Only use these places for sightseeing and activities.",
  places.attractions
)}

NEARBY PLACE INFORMATION
${nearbyPlaceInformation}

STRICT PLACE RULES

1. Restaurants may ONLY be used as restaurants or meal locations.
2. Hotels and stays may ONLY be used as accommodation.
3. Attractions may ONLY be used for sightseeing or activities.
4. Roads, streets, areas, neighborhoods, landmarks, or generic place descriptions
   must NOT be presented as restaurants, hotels, or attractions.
5. Never invent a place.
6. Never change a real place's name.
7. Never invent an address, coordinate, rating, review, price, or service.
8. If a suitable real restaurant is unavailable, say "Enjoy a local meal nearby"
   instead of inventing a restaurant.
9. If a suitable attraction is unavailable, use a generic activity without
   inventing a place.
10. Choose ONE stay from REAL HOTELS AND STAYS and use it throughout the trip.
11. Prefer places that are geographically close to each other to reduce transport
    time and cost.
12. Prefer budget-friendly options when the supplied data contains price information.
`;

    const prompt = `
Create a professional ${days}-day travel itinerary for ${destination}.

TRIP INFORMATION

Destination: ${destination}

Real destination:
${location.address}

Coordinates:
Latitude: ${location.latitude}
Longitude: ${location.longitude}

Total trip budget: ${budget} INR

Travelers: ${travelers}

Interests:
${interestText}

REAL PLACES FROM GEOAPIFY

${realPlaceInformation}

IMPORTANT:

The real places above were retrieved from Geoapify.

Only mention places that appear in the supplied real-place data.

Never invent a restaurant.
Never invent a hotel.
Never invent a resort.
Never invent an attraction.
Never invent an address.
Never invent coordinates.
Never invent ratings.
Never invent reviews.
Never assume a hotel or stay provides breakfast, meals, transport, activities, or other services unless the supplied data explicitly says so.

Return ONLY valid JSON.

Do not use markdown.
Do not use code fences.
Do not write any explanation before or after the JSON.

Use exactly this structure:

{
  "itinerary": [
    {
      "day": 1,
      "title": "Day title",
      "morning": "Morning activity",
      "afternoon": "Afternoon activity",
      "evening": "Evening activity",
      "food": {
        "breakfast": "Breakfast recommendation",
        "lunch": "Lunch recommendation",
        "dinner": "Dinner recommendation"
      },
      "budget": {
  "stay": 3000,
  "food": 1500,
  "activities": 1000,
  "transport": 500,
  "total": 6000
}
    }
  ]
}

RULES:

- Create exactly ${days} itinerary objects.
- Every day budget MUST contain stay, food, activities, transport, and total.
- stay must represent accommodation cost.
- food must represent breakfast, lunch, and dinner.
- activities must represent attraction and activity costs.
- transport must represent local travel between selected real places.
- total MUST equal stay + food + activities + transport.
- Never set stay, food, activities, and transport all to 0 when a daily total is available.
- The combined daily totals MUST equal the supplied total trip budget exactly.
- Allocate the budget realistically across accommodation, food, activities, and transport.
- Day numbers must start at 1.
- Continue sequentially until day ${days}.
- Consider ${travelers} travelers.
- Focus strongly on ${interestText}.
- Keep activities concise and realistic.
- Prefer restaurants and stays that are geographically close to the attractions used that day.
- Prefer nearby places with shorter distances when multiple suitable options are available.
- Minimize unnecessary travel between activities, restaurants, and accommodation.
- The distance information is calculated from real Geoapify coordinates and should be used when choosing places.

FOOD RULES:

- Every day MUST contain breakfast, lunch, and dinner.
- Recommend restaurants only from the supplied restaurant list.
- Never invent restaurant names.
- Prefer a different restaurant for lunch and dinner on the same day when enough real restaurants are available.
- Avoid using the same restaurant for multiple meals across consecutive days unless there are not enough suitable restaurants.
- Breakfast, lunch, and dinner must be realistic meal recommendations.
- If the supplied restaurant list does not contain a suitable breakfast location, use a generic breakfast recommendation.
- Do not claim that a hotel or resort provides breakfast unless the supplied data explicitly confirms it.
- Do not invent food prices.
- Do not invent restaurant ratings or reviews.
- Keep food recommendations concise.
- The food object is the authoritative meal plan for the day.
- Do not put restaurant names into morning, afternoon, or evening unless that meal or restaurant visit is genuinely part of that activity.
- Do not duplicate the exact same meal description across breakfast, lunch, and dinner.
- Match food recommendations to the traveler's interests whenever possible.

PLACE RULES:

- Use real place names from the supplied Geoapify data whenever possible.
- Never create a place name that is not in the supplied Geoapify data.
- Only recommend restaurants from the supplied restaurant list.
- Only recommend stays from the supplied stay list.
- Only recommend attractions from the supplied attraction list.
- Do not use a restaurant as a hotel or attraction.
- Do not use a hotel as a restaurant or attraction.
- Do not use an attraction as a restaurant or hotel.
- Match places to the traveler's interests.
- Prefer attractions for sightseeing and activities.
- Prefer restaurants for meals.
- Prefer stays for accommodation.
- Choose one stay from the supplied stay list and use the same stay for the entire trip.
- Do not change hotels or accommodations between days unless the user explicitly requests multiple stays.
- The selected stay must be mentioned in the morning or evening activity of Day 1.
- Use that same selected stay whenever accommodation is mentioned on later days.
- Avoid repeating the same attraction unless necessary.
- Do not recommend alcohol-related places unless nightlife is one of the selected interests.
- If there are not enough suitable real places for an activity, use a generic activity without inventing a place name.
- Never invent addresses, coordinates, ratings, reviews, prices, or other factual details.

BUDGET RULES:

- The total trip budget is ${budget} INR.
- Every day MUST contain a budget object.
- The budget object MUST contain exactly:
  stay
  food
  activities
  transport
  total

- All budget values must be numbers.
- stay = accommodation cost for that day.
- food = combined breakfast, lunch, and dinner cost for that day.
- activities = attraction and activity costs for that day.
- transport = local transportation costs for that day.
- total MUST equal stay + food + activities + transport.
- Never use negative numbers.
- Do not include currency symbols.
- Do not use decimals.
- Consider ${travelers} travelers when estimating costs.
- The sum of all daily "total" values MUST equal exactly ${budget}.
- Allocate the budget realistically across ${days} days.d
`;

    console.log(
      "Generating itinerary with Hugging Face..."
    );

    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${HF_TOKEN}`,
        },

        body: JSON.stringify({
          model:
            "openai/gpt-oss-120b:fastest",

          messages: [
            {
              role: "system",
              content:
                "You are a professional travel planner. Follow the requested JSON structure exactly. Never invent real-world place information when a supplied list is provided.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],

          temperature: 0.25,
          max_tokens: 5000,
        }),
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      console.error(
        "Hugging Face API error:",
        JSON.stringify(
          data,
          null,
          2
        )
      );

      const message =
        typeof data?.error ===
        "string"
          ? data.error
          : data?.error?.message ||
            "Hugging Face API request failed.";

      return NextResponse.json(
        {
          error: message,
        },
        {
          status:
            response.status,
        }
      );
    }

    let generatedText =
      data?.choices?.[0]?.message?.content ||
      "";

    if (
      typeof generatedText !==
      "string"
    ) {
      generatedText = String(
        generatedText || ""
      );
    }

    generatedText =
      generatedText.trim();

    if (!generatedText) {
      return NextResponse.json(
        {
          error:
            "Hugging Face returned an empty response.",
        },
        { status: 500 }
      );
    }

    console.log(
  "Hugging Face response:",
  generatedText
);

    generatedText =
      cleanAIResponse(
        generatedText
      );

    let parsed: any;

    try {
      parsed =
        JSON.parse(
          generatedText
        );
    } catch {
      console.error(
        "Invalid JSON from Hugging Face:"
      );

      console.error(
        generatedText
      );

      return NextResponse.json(
        {
          error:
            "AI returned invalid itinerary data. Please try again.",
        },
        { status: 500 }
      );
    }

    if (
      !Array.isArray(
        parsed?.itinerary
      )
    ) {
      return NextResponse.json(
        {
          error:
            "AI response does not contain a valid itinerary.",
        },
        { status: 500 }
      );
    }

    if (parsed.itinerary.length !== days) {
  return NextResponse.json(
    {
      error: `AI returned ${parsed.itinerary.length} days instead of ${days}. Please try again.`,
    },
    { status: 500 }
  );
}

    const itinerary: DayPlan[] = [];

for (let index = 0; index < days; index++) {
  const item = parsed.itinerary?.[index];

  const dailyBudget: DayBudget = {
    stay:
      typeof item?.budget === "object" &&
      item.budget !== null &&
      typeof item.budget.stay === "number"
        ? Math.max(0, Math.round(item.budget.stay))
        : 0,

    food:
      typeof item?.budget === "object" &&
      item.budget !== null &&
      typeof item.budget.food === "number"
        ? Math.max(0, Math.round(item.budget.food))
        : 0,

    activities:
      typeof item?.budget === "object" &&
      item.budget !== null &&
      typeof item.budget.activities === "number"
        ? Math.max(0, Math.round(item.budget.activities))
        : 0,

    transport:
      typeof item?.budget === "object" &&
      item.budget !== null &&
      typeof item.budget.transport === "number"
        ? Math.max(0, Math.round(item.budget.transport))
        : 0,

    total: 0,
      
  };

  dailyBudget.total =
  dailyBudget.stay +
  dailyBudget.food +
  dailyBudget.activities +
  dailyBudget.transport;

  

  itinerary.push({
    day: index + 1,

    title:
      typeof item?.title === "string" && item.title.trim()
        ? item.title.trim()
        : `Explore ${destination}`,

    morning:
      typeof item?.morning === "string" && item.morning.trim()
        ? item.morning.trim()
        : "Explore the destination and start the day locally.",

    afternoon:
      typeof item?.afternoon === "string" && item.afternoon.trim()
        ? item.afternoon.trim()
        : "Discover a popular local area and enjoy regional food.",

    evening:
      typeof item?.evening === "string" && item.evening.trim()
        ? item.evening.trim()
        : "Enjoy a relaxed evening in the destination.",

    food: {
      breakfast:
        typeof item?.food?.breakfast === "string" &&
        item.food.breakfast.trim()
          ? item.food.breakfast.trim()
          : "Enjoy a local breakfast.",

      lunch:
        typeof item?.food?.lunch === "string" &&
        item.food.lunch.trim()
          ? item.food.lunch.trim()
          : "Enjoy a local lunch.",

      dinner:
        typeof item?.food?.dinner === "string" &&
        item.food.dinner.trim()
          ? item.food.dinner.trim()
          : "Enjoy a local dinner.",
    },

    budget: dailyBudget,
  });
}

const dailyBaseBudget = Math.floor(budget / days);
const remainingBudget = budget - dailyBaseBudget * days;

itinerary.forEach((day, index) => {
  const targetTotal =
    dailyBaseBudget + (index < remainingBudget ? 1 : 0);

  const currentBreakdown =
    day.budget.stay +
    day.budget.food +
    day.budget.activities +
    day.budget.transport;

  if (currentBreakdown === 0) {
    day.budget.food = targetTotal;
    day.budget.total = targetTotal;
    return;
  }

  const scale = targetTotal / currentBreakdown;

  day.budget.stay = Math.round(
  day.budget.stay * scale
);

day.budget.food = Math.round(
  day.budget.food * scale
);

day.budget.activities = Math.round(
  day.budget.activities * scale
);

day.budget.transport =
  targetTotal -
  day.budget.stay -
  day.budget.food -
  day.budget.activities;

day.budget.total =
  day.budget.stay +
  day.budget.food +
  day.budget.activities +
  day.budget.transport;
});

     const result = {
      message:
        "Trip generated successfully",

      destination,

      budget,

      days,

      travelers,

      interests,

      location,

      places,

      itinerary,
    };

    console.log(
      "Final trip:",
      JSON.stringify(
        result,
        null,
        2
      )
    );

    return NextResponse.json(
      result
    );
  } catch (error) {
    console.error(
      "Generate trip error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate trip.",
      },
      {
        status: 500,
      }
    );
  }
}

