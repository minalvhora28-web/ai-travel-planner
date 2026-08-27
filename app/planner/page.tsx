
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const TripMap = dynamic(() => import("./TripMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 450,
        marginTop: 35,
        borderRadius: 28,
        background: "#f1f3f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#777",
      }}
    >
      Loading map...
    </div>
  ),
});


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

type Place = {
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  category?: string;
};

type TripResponse = {
  destination?: string;
  days?: number;
  travelers?: number;
  budget?: number;
  interests?: string[];

  location?: {
    name?: string;
    address?: string;
    latitude: number;
    longitude: number;
  };

  places?: {
    restaurants?: Place[];
    stays?: Place[];
    attractions?: Place[];
  };

  itinerary: DayPlan[];
};

const interestOptions = [
  "Beaches",
  "Food",
  "Adventure",
  "Culture",
  "Nature",
  "Shopping",
  "Nightlife",
  "Relaxation",
];

const destinationCards = [
  {
    name: "Goa",
    description: "Coastal escapes and unforgettable sunsets",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1400&q=85",
  },
  {
    name: "Kerala",
    description: "Backwaters, nature and peaceful stays",
    image:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1400&q=85",
  },
  {
    name: "Rajasthan",
    description: "Royal architecture and rich culture",
    image:
      "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1400&q=85",
  },
];

export default function Planner() {
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState("3");
  const [travelers, setTravelers] = useState("2");
  const [budget, setBudget] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

  const [trip, setTrip] = useState<TripResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const rupee = String.fromCharCode(8377);

  const money = (value: number) =>
    `${rupee}${Number(value || 0).toLocaleString("en-IN")}`;

  const toggleInterest = (name: string) => {
    setInterests((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name]
    );
  };

  const chooseDestination = (name: string) => {
    setDestination(name);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const generateTrip = async () => {
    setError("");
    setTrip(null);

    if (!destination.trim()) {
      setError("Please enter a destination.");
      return;
    }

    if (!days || Number(days) < 1) {
      setError("Please enter the number of days.");
      return;
    }

    if (!travelers || Number(travelers) < 1) {
      setError("Please enter the number of travelers.");
      return;
    }

    if (!budget || Number(budget) <= 0) {
      setError("Please enter your travel budget.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/generate-trip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination: destination.trim(),
          days: Number(days),
          travelers: Number(travelers),
          budget: Number(budget),
          interests,
        }),
      });

      const text = await response.text();

console.log("API STATUS:", response.status);
console.log("API RESPONSE:", text);

let data;

try {
  data = JSON.parse(text);
} catch {
  throw new Error(
    `Server returned invalid JSON. Status: ${response.status}`
  );
}

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to create your trip."
        );
      }

      if (!data.itinerary || !Array.isArray(data.itinerary)) {
        throw new Error(
          "The server did not return a valid itinerary."
        );
      }
      
      console.log(
  "FRONTEND ITINERARY JSON:",
  JSON.stringify(data.itinerary, null, 2)
);

console.log(
  "FIRST DAY BUDGET:",
  data.itinerary?.[0]?.budget
);

      setTrip(data);

      setTimeout(() => {
        document
          .getElementById("trip-result")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 150);
    } catch (err) {
      console.error("Trip generation error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating your trip."
      );
    } finally {
      setLoading(false);
    }
  };

  

  const estimatedTotal =
  trip?.itinerary?.reduce(
    (sum, day) => sum + (day.budget?.total ?? 0),
    0
  ) ?? 0;
return (
  <>
    <style>{`
      .planner-page {
        overflow-x: hidden;
      }

      @media (max-width: 768px) {
        .planner-card {
          padding: 24px 16px !important;
          border-radius: 22px !important;
        }

        .form-grid {
          grid-template-columns: 1fr !important;
        }

        .interest-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }

        .budget-box {
          flex-direction: column !important;
          align-items: stretch !important;
        }

        .budget-input-wrap {
          min-width: 0 !important;
          width: 100% !important;
        }

        .destination-grid {
          grid-template-columns: 1fr !important;
        }

        .summary-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }

        .day-top {
          grid-template-columns: 52px minmax(0, 1fr) !important;
          padding: 20px !important;
        }

        .day-budget {
          grid-column: 2 !important;
          text-align: left !important;
        }

        .activity-grid {
          grid-template-columns: 1fr !important;
        }

        .activity {
          border-right: 0 !important;
          border-bottom: 1px solid #eeeeea;
        }

        .food-grid {
          grid-template-columns: 1fr !important;
        }

        .budget-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }

        .nearby-grid {
          grid-template-columns: 1fr !important;
        }

        .final-cost {
          flex-direction: column !important;
          align-items: flex-start !important;
        }

        .hero {
          min-height: 650px !important;
        }

        .hero-content {
          min-height: 650px !important;
          padding: 20px 18px 28px !important;
        }

        .hero-title {
          font-size: clamp(52px, 17vw, 82px) !important;
        }

        .hero-description {
          font-size: 14px !important;
        }

        .hero-bottom {
          gap: 12px !important;
          flex-wrap: wrap !important;
        }
      }

      @media (max-width: 480px) {
        .interest-grid {
          grid-template-columns: 1fr !important;
        }

        .summary-grid {
          grid-template-columns: 1fr !important;
        }

        .day-top {
          grid-template-columns: 1fr !important;
        }

        .day-budget {
          grid-column: 1 !important;
        }

        .day-number {
          width: 48px !important;
          height: 48px !important;
        }

        .day-title {
          font-size: 20px !important;
        }

        .inspiration-title {
          font-size: 32px !important;
        }

        .result-title {
          font-size: 48px !important;
        }

        .budget-grid {
          grid-template-columns: 1fr !important;
        }

        .nearby-grid {
          grid-template-columns: 1fr !important;
        }

        .hero-bottom {
          display: grid !important;
          grid-template-columns: 1fr !important;
          text-align: center !important;
        }

        .hero-line {
          display: none !important;
        }
      }
    `}</style>

    <main className="planner-page" style={styles.page}>


      {/* HERO */}

      <section style={styles.hero}>
        <div style={styles.heroImage} />

        <div style={styles.heroOverlay} />

        <div style={styles.heroContent}>
          <div style={styles.topBar}>
            <div style={styles.brand}>
              <div style={styles.brandMark}>T</div>

              <div>
                <div style={styles.brandName}>
                  Travel Planner
                </div>

                <div style={styles.brandSmall}>
                  Intelligent travel planning
                </div>
              </div>
            </div>

            <div style={styles.topBadge}>
              AI TRAVEL STUDIO
            </div>
          </div>

          <div style={styles.heroCenter}>
            <div style={styles.heroEyebrow}>
              YOUR JOURNEY STARTS HERE
            </div>

            <h1 style={styles.heroTitle}>
              Travel more.
              <br />
              <span style={styles.heroAccent}>
                Plan less.
              </span>
            </h1>

            <p style={styles.heroDescription}>
              Create a personalized itinerary around
              your destination, budget and the things
              you love.
            </p>

            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("planner")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
              style={styles.heroButton}
            >
              Start planning
              <span style={styles.arrow}>→</span>
            </button>
          </div>

          <div style={styles.heroBottom}>
            <div>
              <strong style={styles.heroNumber}>01</strong>
              <span style={styles.heroLabel}>
                Choose destination
              </span>
            </div>

            <div style={styles.heroLine} />

            <div>
              <strong style={styles.heroNumber}>02</strong>
              <span style={styles.heroLabel}>
                Tell us your style
              </span>
            </div>

            <div style={styles.heroLine} />

            <div>
              <strong style={styles.heroNumber}>03</strong>
              <span style={styles.heroLabel}>
                Get your itinerary
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* PLANNER */}

      <section id="planner" style={styles.plannerSection}>
        <div style={styles.plannerCard}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionNumber}>
              01
            </div>

            <div>
              <div style={styles.sectionKicker}>
                TRIP DETAILS
              </div>

              <h2 style={styles.sectionTitle}>
                Let's plan your escape.
              </h2>

              <p style={styles.sectionDescription}>
                Start with the basics. Everything can
                be customized around you.
              </p>
            </div>
          </div>

          <div className="form-grid" style={styles.formGrid}>
            {/* DESTINATION */}

            <div style={styles.destinationBox}>
              <label style={styles.fieldLabel}>
                Destination
              </label>

              <div style={styles.destinationInputWrap}>
                <span style={styles.inputIcon}>
                  ◇
                </span>

                <input
                  value={destination}
                  onChange={(e) =>
                    setDestination(e.target.value)
                  }
                  placeholder="Where do you want to go?"
                  style={styles.destinationInput}
                />
              </div>
            </div>

            {/* DAYS */}

            <div style={styles.smallField}>
              <label style={styles.fieldLabel}>
                Duration
              </label>

              <input
                type="number"
                min="1"
                max="30"
                value={days}
                onChange={(e) =>
                  setDays(e.target.value)
                }
                onWheel={(e) =>
                  e.currentTarget.blur()
                }
                style={styles.numberInput}
              />

              <span style={styles.fieldSuffix}>
                days
              </span>
            </div>

            {/* TRAVELERS */}

            <div style={styles.smallField}>
              <label style={styles.fieldLabel}>
                Travelers
              </label>

              <input
                type="number"
                min="1"
                value={travelers}
                onChange={(e) =>
                  setTravelers(e.target.value)
                }
                onWheel={(e) =>
                  e.currentTarget.blur()
                }
                style={styles.numberInput}
              />

              <span style={styles.fieldSuffix}>
                people
              </span>
            </div>
          </div>

          {/* BUDGET */}

          <div className="budget-box" style={styles.budgetBox}>
            <div>
              <div style={styles.fieldLabel}>
                Travel budget
              </div>

              <div style={styles.budgetHint}>
                Approximate total amount
              </div>
            </div>

            <div className="budget-input-wrap" style={styles.budgetInputWrap}>
              <span style={styles.currency}>
                {rupee}
              </span>

              <input
                type="number"
                min="1"
                value={budget}
                onChange={(e) =>
                  setBudget(e.target.value)
                }
                onWheel={(e) =>
                  e.currentTarget.blur()
                }
                placeholder="50,000"
                style={styles.budgetInput}
              />
            </div>
          </div>

          {/* INTERESTS */}

          <div style={styles.interestsSection}>
            <div style={styles.interestsHeader}>
              <div>
                <div style={styles.sectionKicker}>
                  YOUR STYLE
                </div>

                <h3 style={styles.interestsTitle}>
                  What kind of traveler are you?
                </h3>
              </div>

              <div style={styles.selectedCount}>
                {interests.length} selected
              </div>
            </div>

            <div className="interest-grid" style={styles.interestGrid}>
              {interestOptions.map((interest) => {
                const selected =
                  interests.includes(interest);

                return (
                  <label
                    key={interest}
                    style={{
                      ...styles.interestCard,
                      ...(selected
                        ? styles.interestSelected
                        : {}),
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        toggleInterest(interest)
                      }
                      style={styles.hiddenCheckbox}
                    />

                    <span
                      style={{
                        ...styles.checkCircle,
                        ...(selected
                          ? styles.checkCircleSelected
                          : {}),
                      }}
                    >
                      {selected ? "✓" : ""}
                    </span>

                    <span
                      style={{
                        ...styles.interestText,
                        ...(selected
                          ? styles.interestTextSelected
                          : {}),
                      }}
                    >
                      {interest}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* ERROR */}

          {error && (
            <div style={styles.errorBox}>
              {error}
            </div>
          )}

          {/* ACTION */}

          <div style={styles.actionArea}>
            <button
              type="button"
              onClick={generateTrip}
              disabled={loading}
              style={{
                ...styles.generateButton,
                ...(loading
                  ? styles.generateButtonDisabled
                  : {}),
              }}
            >
              <span>
                {loading
                  ? "Creating your journey..."
                  : "Create my itinerary"}
              </span>

              {!loading && (
                <span style={styles.buttonArrow}>
                  →
                </span>
              )}
            </button>

            <p style={styles.actionNote}>
              Personalized around your preferences
            </p>
          </div>
        </div>
      </section>

      {/* INSPIRATION */}

      {!trip && !loading && (
        <section style={styles.inspiration}>
          <div style={styles.inspirationHeader}>
            <div style={styles.sectionKicker}>
              NEED INSPIRATION?
            </div>

            <h2 style={styles.inspirationTitle}>
              Somewhere beautiful awaits.
            </h2>

            <p style={styles.inspirationDescription}>
              Choose a destination and make it the
              starting point for your next adventure.
            </p>
          </div>

          <div style={styles.destinationGrid}>
            {destinationCards.map((card) => (
              <button
                key={card.name}
                type="button"
                onClick={() =>
                  chooseDestination(card.name)
                }
                style={styles.destinationCard}
              >
                <img
                  src={card.image}
                  alt={card.name}
                  style={styles.destinationImage}
                />

                <div style={styles.destinationShade} />

                <div style={styles.destinationContent}>
                  <div style={styles.destinationSmall}>
                    EXPLORE
                  </div>

                  <div style={styles.destinationName}>
                    {card.name}
                  </div>

                  <div style={styles.destinationDescription}>
                    {card.description}
                  </div>

                  <div style={styles.destinationExplore}>
                    Plan this trip
                    <span>→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* LOADING */}

      {loading && (
        <section style={styles.loadingSection}>
          <div style={styles.loadingCard}>
            <div style={styles.loadingOrb}>
              <div style={styles.loadingDot} />
            </div>

            <div style={styles.loadingKicker}>
              CREATING YOUR JOURNEY
            </div>

            <h2 style={styles.loadingTitle}>
              Turning your ideas into a trip.
            </h2>

            <p style={styles.loadingText}>
              Your destination, budget and interests
              are being combined into a personalized
              itinerary.
            </p>

            <div style={styles.loadingBar}>
              <div style={styles.loadingBarInner} />
            </div>
          </div>
        </section>
      )}

      {/* RESULT */}

      {trip && !loading && (
        <section
          id="trip-result"
          style={styles.resultSection}
        >
          <div style={styles.resultContainer}>
            <div style={styles.resultHeader}>
              <div style={styles.resultKicker}>
                YOUR JOURNEY IS READY
              </div>

              <h2 style={styles.resultTitle}>
                {trip.destination}
              </h2>

              <p style={styles.resultDescription}>
                A carefully structured {trip.days}-day
                journey designed for{" "}
                {trip.travelers} traveler
                {Number(trip.travelers) === 1
                  ? ""
                  : "s"}.
              </p>
            </div>

            {/* SUMMARY */}

            <div style={styles.summaryGrid}>
              <div style={styles.summaryCard}>
                <span style={styles.summaryLabel}>
                  Duration
                </span>

                <strong style={styles.summaryValue}>
                  {trip.days}
                </strong>

                <span style={styles.summaryBottom}>
                  days
                </span>
              </div>

              <div style={styles.summaryCard}>
                <span style={styles.summaryLabel}>
                  Travelers
                </span>

                <strong style={styles.summaryValue}>
                  {trip.travelers}
                </strong>

                <span style={styles.summaryBottom}>
                  people
                </span>
              </div>

              <div style={styles.summaryCard}>
                <span style={styles.summaryLabel}>
                  Budget
                </span>

                <strong
                  style={{
                    ...styles.summaryValue,
                    fontSize: 25,
                  }}
                >
                  {money(Number(trip.budget || 0))}
                </strong>

                <span style={styles.summaryBottom}>
                  planned
                </span>
              </div>

              <div style={styles.summaryDark}>
                <span style={styles.summaryLabelDark}>
                  Estimated cost
                </span>

                <strong style={styles.summaryValueDark}>
                  {money(estimatedTotal)}
                </strong>

                <span style={styles.summaryBottomDark}>
                  itinerary
                </span>
              </div>
            </div>

            <TripMap
                location={trip.location}
                places={trip.places}
            />


           {/* NEARBY PLACES */}

<div
  style={{
    marginTop: 35,
    padding: 30,
    borderRadius: 28,
    background: "white",
    boxShadow: "0 18px 45px rgba(20,30,50,.07)",
    border: "1px solid rgba(20,30,50,.05)",
  }}
>
  <div style={styles.sectionKicker}>
    NEARBY PLACES
  </div>

  <h3
    style={{
      margin: "10px 0 0",
      fontSize: 30,
      fontWeight: 950,
      letterSpacing: "-.04em",
    }}
  >
    Places worth visiting.
  </h3>

  <p
    style={{
      margin: "8px 0 25px",
      color: "#7b8392",
      fontSize: 13,
    }}
  >
    Explore attractions, restaurants and stays around your destination.
  </p>

  <div
  className="nearby-grid"
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 15,
  }}
>
    {/* ATTRACTIONS */}
    <div
      style={{
        padding: 20,
        borderRadius: 18,
        background: "#f7f7f5",
        border: "1px solid #e6e6e1",
      }}
    >
      <div style={styles.foodLabel}>
        Attractions
      </div>

      {trip.places?.attractions?.length ? (
        trip.places.attractions.map((place) => (
          <div
            key={`${place.name}-${place.latitude}-${place.longitude}`}
            style={{
              padding: "12px 0",
              borderBottom: "1px solid #e5e1d8",
            }}
          >
            <strong
              style={{
                display: "block",
                color: "#172033",
                fontSize: 13,
              }}
            >
              {place.name}
            </strong>

            {place.address && (
              <span
                style={{
                  display: "block",
                  marginTop: 4,
                  color: "#7c8492",
                  fontSize: 11,
                  lineHeight: 1.5,
                }}
              >
                {place.address}
              </span>
            )}
          </div>
        ))
      ) : (
        <p style={styles.activityText}>
          No attractions found.
        </p>
      )}
    </div>

    {/* RESTAURANTS */}
    <div
      style={{
        padding: 20,
        borderRadius: 18,
        background: "#f7f7f5",
        border: "1px solid #e6e6e1",
      }}
    >
      <div style={styles.foodLabel}>
        Restaurants
      </div>

      {trip.places?.restaurants?.length ? (
        trip.places.restaurants.map((place) => (
          <div
            key={`${place.name}-${place.latitude}-${place.longitude}`}
            style={{
              padding: "12px 0",
              borderBottom: "1px solid #e5e1d8",
            }}
          >
            <strong
              style={{
                display: "block",
                color: "#172033",
                fontSize: 13,
              }}
            >
              {place.name}
            </strong>

            {place.address && (
              <span
                style={{
                  display: "block",
                  marginTop: 4,
                  color: "#7c8492",
                  fontSize: 11,
                  lineHeight: 1.5,
                }}
              >
                {place.address}
              </span>
            )}
          </div>
        ))
      ) : (
        <p style={styles.activityText}>
          No restaurants found.
        </p>
      )}
    </div>

    {/* STAYS */}
    <div
      style={{
        padding: 20,
        borderRadius: 18,
        background: "#f7f7f5",
        border: "1px solid #e6e6e1",
      }}
    >
      <div style={styles.foodLabel}>
        Stays
      </div>

      {trip.places?.stays?.length ? (
        trip.places.stays.map((place) => (
          <div
            key={`${place.name}-${place.latitude}-${place.longitude}`}
            style={{
              padding: "12px 0",
              borderBottom: "1px solid #e5e1d8",
            }}
          >
            <strong
              style={{
                display: "block",
                color: "#172033",
                fontSize: 13,
              }}
            >
              {place.name}
            </strong>

            {place.address && (
              <span
                style={{
                  display: "block",
                  marginTop: 4,
                  color: "#7c8492",
                  fontSize: 11,
                  lineHeight: 1.5,
                }}
              >
                {place.address}
              </span>
            )}
          </div>
        ))
      ) : (
        <p style={styles.activityText}>
          No stays found.
        </p>
      )}
    </div>
  </div>
</div>

            {/* DAY PLANS */}

            <div style={styles.daysHeader}>
              <div style={styles.sectionKicker}>
                THE ITINERARY
              </div>

              <h3 style={styles.daysTitle}>
                Your journey, day by day.
              </h3>
            </div>

            <div style={styles.dayList}>
              {trip.itinerary.map((day) => (
                <article
                  key={day.day}
                  style={styles.dayCard}
                >
                  <div style={styles.dayTop}>
                    <div style={styles.dayNumber}>
                      {String(day.day).padStart(2, "0")}
                    </div>

                    <div style={styles.dayTopText}>
                      <span style={styles.dayKicker}>
                        DAY {day.day}
                      </span>

                      <h4 style={styles.dayTitle}>
                        {day.title}
                      </h4>
                    </div>

                    <div style={styles.dayBudget}>
                      <span>
                        DAILY BUDGET
                      </span>

                      <strong>
                        {money(Number(day.budget?.total || 0))}
                    </strong>
                    </div>
                  </div>

                  <div style={styles.activityGrid}>
                    <div style={styles.activity}>
                      <div style={styles.activityNumber}>
                        01
                      </div>

                      <div>
                        <div style={styles.activityTitle}>
                          Morning
                        </div>

                        <p style={styles.activityText}>
                          {day.morning}
                        </p>
                      </div>
                    </div>

                    <div style={styles.activity}>
                      <div style={styles.activityNumber}>
                        02
                      </div>

                      <div>
                        <div style={styles.activityTitle}>
                          Afternoon
                        </div>

                        <p style={styles.activityText}>
                          {day.afternoon}
                        </p>
                      </div>
                    </div>

                    <div style={styles.activity}>
                      <div style={styles.activityNumber}>
                        03
                      </div>

                      <div>
                        <div style={styles.activityTitle}>
                          Evening
                        </div>

                        <p style={styles.activityText}>
                          {day.evening}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={styles.foodSection}>
  <div style={styles.foodHeader}>
    <div style={styles.foodNumber}>
      04
    </div>




   <div>
      <div style={styles.activityTitle}>
        Food
      </div>

      <p style={styles.foodIntro}>
        Local food recommendations for the day
      </p>
    </div>
  </div>

  <div style={styles.foodGrid}>
    <div style={styles.foodItem}>
      <div style={styles.foodLabel}>
        Breakfast
      </div>
      <p style={styles.activityText}>
        {day.food?.breakfast}
      </p>
    </div>

    <div style={styles.foodItem}>
      <div style={styles.foodLabel}>
        Lunch
      </div>
      <p style={styles.activityText}>
        {day.food?.lunch}
      </p>
    </div>

    <div style={styles.foodItem}>
      <div style={styles.foodLabel}>
        Dinner
      </div>
      <p style={styles.activityText}>
        {day.food?.dinner}
      </p>
    </div>
  </div>
</div>


{/* BUDGET BREAKDOWN */}

<div
  style={{
    marginTop: 20,
    padding: 24,
    borderRadius: 20,
    background: "#f7f7f5",
    border: "1px solid #e5e1d8",
  }}
>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 18,
    }}
  >
    <div>
      <div style={styles.foodLabel}>
        Budget Breakdown
      </div>

      <div
        style={{
          marginTop: 5,
          color: "#7c8492",
          fontSize: 11,
        }}
      >
        Estimated spending for this day
      </div>
    </div>

    <strong
      style={{
        color: "#172033",
        fontSize: 20,
        fontWeight: 950,
      }}
    >
      {money(Number(day.budget?.total || 0))}
    </strong>
  </div>

  <div
  className="budget-grid"
  style={{
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: 10,
  }}
>
    <div
      style={{
        padding: 15,
        borderRadius: 14,
        background: "white",
        border: "1px solid #e5e1d8",
      }}
    >
      <div style={styles.foodLabel}>
        Stay
      </div>

      <strong style={{ color: "#172033" }}>
        {money(Number(day.budget?.stay || 0))}
      </strong>
    </div>

    <div
      style={{
        padding: 15,
        borderRadius: 14,
        background: "white",
        border: "1px solid #e5e1d8",
      }}
    >
      <div style={styles.foodLabel}>
        Food
      </div>

      <strong style={{ color: "#172033" }}>
        {money(Number(day.budget?.food || 0))}
      </strong>
    </div>

    <div
      style={{
        padding: 15,
        borderRadius: 14,
        background: "white",
        border: "1px solid #e5e1d8",
      }}
    >
      <div style={styles.foodLabel}>
        Activities
      </div>

      <strong style={{ color: "#172033" }}>
        {money(Number(day.budget?.activities || 0))}
      </strong>
    </div>

    <div
      style={{
        padding: 15,
        borderRadius: 14,
        background: "white",
        border: "1px solid #e5e1d8",
      }}
    >
      <div style={styles.foodLabel}>
        Transport
      </div>

      <strong style={{ color: "#172033" }}>
        {money(Number(day.budget?.transport || 0))}
      </strong>
    </div>
  </div>
</div>

</article>
            

                
              ))}
            </div>

            {/* FINAL COST */}

            <div style={styles.finalCost}>
              <div>
                <div style={styles.finalKicker}>
                  ESTIMATED TRIP COST
                </div>

                <div style={styles.finalDescription}>
                  Based on your generated itinerary
                </div>
              </div>

              <strong style={styles.finalAmount}>
                {money(estimatedTotal)}
              </strong>
            </div>

            <div style={styles.resetArea}>
              <button
                type="button"
                onClick={() => {
                  setTrip(null);
                  setError("");

                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }}
                style={styles.resetButton}
              >
                Plan another trip
              </button>
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}

      <footer style={styles.footer}>
        <div style={styles.footerBrand}>
          Travel Planner
        </div>

        <div style={styles.footerText}>
          Designed to make planning feel effortless.
        </div>
      </footer>
    </main>

   </>
  );
}

/* --------------------------------------------------
   STYLES
-------------------------------------------------- */

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f5f3ee",
    color: "#172033",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  hero: {
    position: "relative",
    minHeight: 720,
    overflow: "hidden",
    background: "#111827",
  },

  heroImage: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=90)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    transform: "scale(1.03)",
  },

  heroOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(7,15,29,.55) 0%, rgba(7,15,29,.25) 45%, rgba(7,15,29,.86) 100%)",
  },

  heroContent: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: 1250,
    minHeight: 720,
    margin: "0 auto",
    padding: "28px 28px 34px",
    display: "flex",
    flexDirection: "column",
  },

  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    color: "white",
  },

  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "white",
    color: "#111827",
    fontWeight: 900,
    fontSize: 18,
  },

  brandName: {
    fontSize: 14,
    fontWeight: 900,
    letterSpacing: ".02em",
  },

  brandSmall: {
    marginTop: 2,
    fontSize: 10,
    color: "rgba(255,255,255,.58)",
  },

  topBadge: {
    border: "1px solid rgba(255,255,255,.2)",
    background: "rgba(255,255,255,.1)",
    backdropFilter: "blur(14px)",
    borderRadius: 999,
    padding: "10px 15px",
    color: "rgba(255,255,255,.9)",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: ".18em",
  },

  heroCenter: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "80px 0 60px",
  },

  heroEyebrow: {
    color: "rgba(255,255,255,.78)",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: ".35em",
  },

  heroTitle: {
    margin: "24px 0 0",
    color: "white",
    fontSize: "clamp(58px, 10vw, 120px)",
    lineHeight: ".9",
    letterSpacing: "-.07em",
    fontWeight: 950,
  },

  heroAccent: {
    color: "#e9c46a",
  },

  heroDescription: {
    maxWidth: 590,
    margin: "30px auto 0",
    color: "rgba(255,255,255,.78)",
    fontSize: 16,
    lineHeight: 1.8,
  },

  heroButton: {
    marginTop: 32,
    border: 0,
    borderRadius: 999,
    padding: "15px 22px 15px 25px",
    background: "#e9c46a",
    color: "#111827",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 22,
    boxShadow: "0 15px 35px rgba(0,0,0,.2)",
  },

  arrow: {
    fontSize: 19,
  },

  heroBottom: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 22,
    color: "white",
  },

  heroNumber: {
    display: "block",
    fontSize: 12,
    letterSpacing: ".1em",
  },

  heroLabel: {
    display: "block",
    marginTop: 4,
    color: "rgba(255,255,255,.55)",
    fontSize: 9,
    letterSpacing: ".08em",
    textTransform: "uppercase",
  },

  heroLine: {
    width: 55,
    height: 1,
    background: "rgba(255,255,255,.25)",
  },

  plannerSection: {
    position: "relative",
    zIndex: 5,
    marginTop: -75,
    padding: "0 20px 90px",
  },

  plannerCard: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "42px",
    background: "rgba(255,255,255,.98)",
    borderRadius: 32,
    boxShadow:
      "0 30px 80px rgba(20,30,50,.16)",
    border: "1px solid rgba(20,30,50,.07)",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: 18,
    maxWidth: 720,
    margin: "0 auto",
    textAlign: "left",
  },

  sectionNumber: {
    minWidth: 42,
    height: 42,
    borderRadius: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#172033",
    color: "white",
    fontSize: 11,
    fontWeight: 900,
  },

  sectionKicker: {
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: ".25em",
    color: "#a77b25",
  },

  sectionTitle: {
    margin: "7px 0 0",
    fontSize: 30,
    lineHeight: 1.15,
    letterSpacing: "-.04em",
    fontWeight: 900,
    color: "#172033",
  },

  sectionDescription: {
    margin: "9px 0 0",
    color: "#778096",
    fontSize: 13,
    lineHeight: 1.7,
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 2fr) minmax(150px, 1fr) minmax(150px, 1fr)",
    gap: 14,
    marginTop: 34,
  },

  destinationBox: {
    minHeight: 120,
    padding: 20,
    borderRadius: 22,
    background: "#f7f7f5",
    border: "1px solid #e6e6e1",
  },

  smallField: {
    position: "relative",
    minHeight: 120,
    padding: 20,
    borderRadius: 22,
    background: "#f7f7f5",
    border: "1px solid #e6e6e1",
  },

  fieldLabel: {
    display: "block",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: ".18em",
    textTransform: "uppercase",
    color: "#8991a1",
  },

  destinationInputWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
  },

  inputIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ebe8de",
    color: "#8e6b28",
    fontSize: 14,
    flexShrink: 0,
  },

  destinationInput: {
    width: "100%",
    border: 0,
    outline: 0,
    background: "transparent",
    fontSize: 17,
    fontWeight: 800,
    color: "#172033",
  },

  numberInput: {
    display: "block",
    width: "100%",
    marginTop: 15,
    border: 0,
    outline: 0,
    background: "transparent",
    color: "#172033",
    fontSize: 30,
    fontWeight: 900,
  },

  fieldSuffix: {
    position: "absolute",
    bottom: 19,
    right: 20,
    color: "#9299a6",
    fontSize: 11,
  },

  budgetBox: {
    marginTop: 14,
    padding: "22px 25px",
    borderRadius: 22,
    background: "#172033",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 25,
  },

  budgetHint: {
    marginTop: 5,
    color: "rgba(255,255,255,.45)",
    fontSize: 11,
  },

  budgetInputWrap: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    minWidth: 230,
    borderBottom:
      "1px solid rgba(255,255,255,.3)",
    paddingBottom: 6,
  },

  currency: {
    color: "#e9c46a",
    fontSize: 25,
    fontWeight: 900,
  },

  budgetInput: {
    width: "100%",
    border: 0,
    outline: 0,
    background: "transparent",
    color: "white",
    textAlign: "right",
    fontSize: 25,
    fontWeight: 900,
  },

  interestsSection: {
    marginTop: 40,
  },

  interestsHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 20,
  },

  interestsTitle: {
    margin: "7px 0 0",
    fontSize: 23,
    fontWeight: 900,
    letterSpacing: "-.03em",
  },

  selectedCount: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "#f4f1e8",
    color: "#92702d",
    fontSize: 10,
    fontWeight: 900,
  },

  interestGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: 10,
    marginTop: 18,
  },

  interestCard: {
    minHeight: 58,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    padding: "12px 15px",
    borderRadius: 16,
    border: "1px solid #e4e5e7",
    background: "white",
    cursor: "pointer",
    transition: "all .2s ease",
  },

  interestSelected: {
    border: "1px solid #172033",
    background: "#172033",
    boxShadow: "0 8px 20px rgba(23,32,51,.14)",
  },

  hiddenCheckbox: {
    position: "absolute",
    opacity: 0,
    pointerEvents: "none",
  },

  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #d5d7dc",
    color: "white",
    fontSize: 11,
    fontWeight: 900,
  },

  checkCircleSelected: {
    border: "1px solid #e9c46a",
    background: "#e9c46a",
    color: "#172033",
  },

  interestText: {
    color: "#596274",
    fontSize: 12,
    fontWeight: 800,
  },

  interestTextSelected: {
    color: "white",
  },

  errorBox: {
    marginTop: 22,
    padding: "13px 17px",
    borderRadius: 14,
    background: "#fff0f0",
    border: "1px solid #ffd0d0",
    color: "#b42323",
    textAlign: "center",
    fontSize: 12,
    fontWeight: 700,
  },

  actionArea: {
    marginTop: 35,
    textAlign: "center",
  },

  generateButton: {
    minWidth: 250,
    border: 0,
    borderRadius: 999,
    padding: "17px 23px",
    background: "#e9c46a",
    color: "#172033",
    fontSize: 13,
    fontWeight: 950,
    cursor: "pointer",
    boxShadow: "0 14px 28px rgba(190,150,50,.2)",
  },

  generateButtonDisabled: {
    opacity: 0.55,
    cursor: "wait",
  },

  buttonArrow: {
    marginLeft: 20,
    fontSize: 17,
  },

  actionNote: {
    marginTop: 10,
    color: "#9aa0ab",
    fontSize: 10,
  },

  inspiration: {
    maxWidth: 1120,
    margin: "0 auto",
    padding: "0 20px 100px",
  },

  inspirationHeader: {
    textAlign: "center",
    maxWidth: 650,
    margin: "0 auto",
  },

  inspirationTitle: {
    margin: "12px 0 0",
    fontSize: 40,
    letterSpacing: "-.05em",
    fontWeight: 950,
  },

  inspirationDescription: {
    margin: "13px auto 0",
    color: "#7b8392",
    fontSize: 14,
    lineHeight: 1.7,
  },

  destinationGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: 16,
    marginTop: 35,
  },

  destinationCard: {
    position: "relative",
    height: 420,
    overflow: "hidden",
    padding: 0,
    border: 0,
    borderRadius: 27,
    cursor: "pointer",
    textAlign: "left",
    background: "#172033",
  },

  destinationImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform .6s ease",
  },

  destinationShade: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(10,20,35,.05) 25%, rgba(10,20,35,.86) 100%)",
  },

  destinationContent: {
    position: "absolute",
    left: 25,
    right: 25,
    bottom: 24,
    color: "white",
  },

  destinationSmall: {
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: ".25em",
    color: "#e9c46a",
  },

  destinationName: {
    marginTop: 8,
    fontSize: 38,
    fontWeight: 950,
    letterSpacing: "-.05em",
  },

  destinationDescription: {
    marginTop: 6,
    color: "rgba(255,255,255,.72)",
    fontSize: 12,
    lineHeight: 1.6,
  },

  destinationExplore: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 19,
    paddingTop: 15,
    borderTop: "1px solid rgba(255,255,255,.18)",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: ".08em",
    textTransform: "uppercase",
  },

  loadingSection: {
    padding: "0 20px 100px",
  },

  loadingCard: {
    maxWidth: 700,
    margin: "0 auto",
    padding: "70px 30px",
    borderRadius: 32,
    background: "white",
    textAlign: "center",
    boxShadow: "0 25px 70px rgba(20,30,50,.09)",
  },

  loadingOrb: {
    width: 64,
    height: 64,
    margin: "0 auto",
    borderRadius: "50%",
    background: "#172033",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 0 12px #f3eee0",
  },

  loadingDot: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    background: "#e9c46a",
  },

  loadingKicker: {
    marginTop: 32,
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: ".25em",
    color: "#a77b25",
  },

  loadingTitle: {
    margin: "12px 0 0",
    fontSize: 28,
    fontWeight: 950,
    letterSpacing: "-.04em",
  },

  loadingText: {
    maxWidth: 500,
    margin: "12px auto 0",
    color: "#7b8392",
    fontSize: 13,
    lineHeight: 1.8,
  },

  loadingBar: {
    maxWidth: 330,
    height: 5,
    margin: "28px auto 0",
    overflow: "hidden",
    borderRadius: 999,
    background: "#ececec",
  },

  loadingBarInner: {
    width: "45%",
    height: "100%",
    borderRadius: 999,
    background: "#e9c46a",
  },

  resultSection: {
    padding: "85px 20px 100px",
    background: "#f5f3ee",
  },

  resultContainer: {
    maxWidth: 1100,
    margin: "0 auto",
  },

  resultHeader: {
    textAlign: "center",
  },

  resultKicker: {
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: ".3em",
    color: "#a77b25",
  },

  resultTitle: {
    margin: "13px 0 0",
    fontSize: "clamp(52px, 8vw, 90px)",
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: "-.07em",
    color: "#172033",
  },

  resultDescription: {
    maxWidth: 570,
    margin: "20px auto 0",
    color: "#7b8392",
    fontSize: 14,
    lineHeight: 1.8,
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: 12,
    marginTop: 40,
  },

  summaryCard: {
    minHeight: 145,
    padding: 25,
    borderRadius: 23,
    background: "white",
    textAlign: "center",
    boxShadow: "0 12px 30px rgba(20,30,50,.05)",
  },

  summaryDark: {
    minHeight: 145,
    padding: 25,
    borderRadius: 23,
    background: "#172033",
    color: "white",
    textAlign: "center",
    boxShadow: "0 12px 30px rgba(20,30,50,.14)",
  },

  summaryLabel: {
    display: "block",
    color: "#9aa0ab",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: ".15em",
    textTransform: "uppercase",
  },

  summaryValue: {
    display: "block",
    marginTop: 13,
    color: "#172033",
    fontSize: 34,
    fontWeight: 950,
  },

  summaryBottom: {
    color: "#a0a6b0",
    fontSize: 10,
  },

  summaryLabelDark: {
    display: "block",
    color: "rgba(255,255,255,.45)",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: ".15em",
    textTransform: "uppercase",
  },

  summaryValueDark: {
    display: "block",
    marginTop: 13,
    color: "#e9c46a",
    fontSize: 27,
    fontWeight: 950,
  },

  summaryBottomDark: {
    color: "rgba(255,255,255,.45)",
    fontSize: 10,
  },

  daysHeader: {
    marginTop: 80,
    textAlign: "center",
  },

  daysTitle: {
    margin: "10px 0 0",
    fontSize: 38,
    fontWeight: 950,
    letterSpacing: "-.05em",
  },

  dayList: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    marginTop: 32,
  },

  dayCard: {
    overflow: "hidden",
    borderRadius: 28,
    background: "white",
    boxShadow: "0 18px 45px rgba(20,30,50,.07)",
    border: "1px solid rgba(20,30,50,.05)",
  },

  dayTop: {
    display: "grid",
    gridTemplateColumns:
      "70px minmax(0, 1fr) auto",
    alignItems: "center",
    gap: 20,
    padding: "25px 30px",
    background: "#172033",
    color: "white",
  },

  dayNumber: {
    width: 58,
    height: 58,
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#e9c46a",
    color: "#172033",
    fontSize: 18,
    fontWeight: 950,
  },

  dayTopText: {
    minWidth: 0,
  },

  dayKicker: {
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: ".22em",
    color: "rgba(255,255,255,.45)",
  },

  dayTitle: {
    margin: "7px 0 0",
    fontSize: 25,
    fontWeight: 900,
    letterSpacing: "-.03em",
  },

  dayBudget: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    textAlign: "right",
  },

  activityGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: 0,
  },

  activity: {
    display: "flex",
    gap: 15,
    padding: "30px 25px",
    borderRight: "1px solid #eeeeea",
  },

  activityNumber: {
    flexShrink: 0,
    width: 34,
    height: 34,
    borderRadius: 11,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f4f1e8",
    color: "#92702d",
    fontSize: 9,
    fontWeight: 900,
  },

  activityTitle: {
    fontSize: 13,
    fontWeight: 900,
    color: "#172033",
  },

  activityText: {
    margin: "9px 0 0",
    color: "#7c8492",
    fontSize: 12,
    lineHeight: 1.75,
  },

  finalCost: {
    marginTop: 25,
    padding: "30px 35px",
    borderRadius: 25,
    background: "#e9c46a",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 30,
  },

  finalKicker: {
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: ".2em",
  },

  finalDescription: {
    marginTop: 6,
    fontSize: 11,
    color: "rgba(23,32,51,.6)",
  },

  finalAmount: {
    fontSize: 34,
    fontWeight: 950,
  },

  resetArea: {
    textAlign: "center",
    marginTop: 35,
  },

  resetButton: {
    border: "1px solid #172033",
    borderRadius: 999,
    padding: "14px 24px",
    background: "transparent",
    color: "#172033",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },

  footer: {
    padding: "35px 20px",
    background: "#172033",
    color: "white",
    textAlign: "center",
  },

  footerBrand: {
    fontSize: 14,
    fontWeight: 900,
  },

  footerText: {
    marginTop: 6,
    color: "rgba(255,255,255,.4)",
    fontSize: 10,
  },

    foodSection: {
    marginTop: 24,
    padding: 24,
    borderRadius: 20,
    background: "#faf9f6",
    border: "1px solid #e5e1d8",
  },

  foodHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },

  foodNumber: {
    width: 42,
    height: 42,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#172033",
    color: "#ffffff",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.08em",
  },

  foodIntro: {
    margin: "4px 0 0",
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 1.5,
  },

  foodGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: 14,
  },

  foodItem: {
    padding: 18,
    borderRadius: 16,
    background: "#ffffff",
    border: "1px solid #e5e1d8",
  },

  foodLabel: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#8b6f47",
  },
};

