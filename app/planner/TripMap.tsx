"use client";

import { useEffect, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Place = {
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  category?: string;
};

type TripMapProps = {
  location?: {
    name?: string;
    address?: string;
    latitude: number;
    longitude: number;
  };
  places?: {
    attractions?: Place[];
    restaurants?: Place[];
    stays?: Place[];
  };
};

const createMarkerIcon = (color: string) =>
  new L.DivIcon({
    className: "custom-trip-marker",
    html: `
      <div
        style="
          width:30px;
          height:30px;
          border-radius:50% 50% 50% 0;
          background:${color};
          border:3px solid white;
          box-shadow:0 4px 12px rgba(0,0,0,.25);
          transform:rotate(-45deg);
          display:flex;
          align-items:center;
          justify-content:center;
        "
      >
        <div
          style="
            width:8px;
            height:8px;
            border-radius:50%;
            background:white;
          "
        ></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });

const destinationIcon = createMarkerIcon("#172033");
const attractionIcon = createMarkerIcon("#3b82f6");
const restaurantIcon = createMarkerIcon("#22a06b");
const stayIcon = createMarkerIcon("#8b5cf6");

export default function TripMap({
  location,
  places,
}: TripMapProps) {
      const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    setMapKey((current) => current + 1);
  }, []);
  /*
   * Do not render Leaflet unless valid coordinates exist.
   */
  if (
    !location ||
    typeof location.latitude !== "number" ||
    typeof location.longitude !== "number" ||
    Number.isNaN(location.latitude) ||
    Number.isNaN(location.longitude)
  ) {
    return null;
  }

  const attractions = places?.attractions ?? [];
  const restaurants = places?.restaurants ?? [];
  const stays = places?.stays ?? [];

  return (
    <div
      style={{
        marginTop: 35,
        overflow: "hidden",
        borderRadius: 28,
        background: "white",
        border: "1px solid rgba(20,30,50,.06)",
        boxShadow: "0 18px 45px rgba(20,30,50,.07)",
      }}
    >
      {/* MAP HEADER */}

      <div
        style={{
          padding: "24px 28px",
          background: "#172033",
          color: "white",
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: ".25em",
            color: "#e9c46a",
          }}
        >
          TRIP MAP
        </div>

        <h3
          style={{
            margin: "7px 0 0",
            fontSize:"clamp(20px, 6vw, 25px)",
            fontWeight: 900,
          }}
        >
          Places around your journey
        </h3>

        <p
          style={{
            margin: "7px 0 0",
            color: "rgba(255,255,255,.55)",
            fontSize: 12,
          }}
        >
          Explore attractions, restaurants and stays from your trip.
        </p>

        {/* LEGEND */}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            marginTop: 18,
            fontSize: 11,
            color: "rgba(255,255,255,.75)",
          }}
        >
          <Legend
            color="#172033"
            border="2px solid white"
            label="Destination"
          />

          <Legend
            color="#3b82f6"
            label="Attractions"
          />

          <Legend
            color="#22a06b"
            label="Restaurants"
          />

          <Legend
            color="#8b5cf6"
            label="Stays"
          />
        </div>
      </div>

      {/* MAP */}

      <MapContainer
  key={mapKey}
  center={[
    location.latitude,
    location.longitude,
  ]}
        zoom={5}
        minZoom={2}
        maxZoom={18}
        scrollWheelZoom={false}
        style={{
          height: "min(450px, 70vw)",
          width: "100%",
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* DESTINATION */}

        <Marker
          position={[
            location.latitude,
            location.longitude,
          ]}
          icon={destinationIcon}
        >
          <Popup>
            <div style={{ minWidth: 180 }}>
              <strong style={{ fontSize: 15 }}>
                {location.name || "Trip destination"}
              </strong>

              {location.address && (
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 12,
                    color: "#666",
                  }}
                >
                  {location.address}
                </p>
              )}
            </div>
          </Popup>
        </Marker>

        {/* ATTRACTIONS */}

        {attractions.map((place, index) => (
          <Marker
            key={`attraction-${index}`}
            position={[
              place.latitude,
              place.longitude,
            ]}
            icon={attractionIcon}
          >
            <Popup>
              <div style={{ minWidth: 190 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: ".12em",
                    color: "#3b82f6",
                    marginBottom: 5,
                  }}
                >
                  ATTRACTION
                </div>

                <strong style={{ fontSize: 15 }}>
                  {place.name}
                </strong>

                {place.address && (
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: "#666",
                    }}
                  >
                    {place.address}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* RESTAURANTS */}

        {restaurants.map((place, index) => (
          <Marker
            key={`restaurant-${index}`}
            position={[
              place.latitude,
              place.longitude,
            ]}
            icon={restaurantIcon}
          >
            <Popup>
              <div style={{ minWidth: 190 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: ".12em",
                    color: "#22a06b",
                    marginBottom: 5,
                  }}
                >
                  RESTAURANT
                </div>

                <strong style={{ fontSize: 15 }}>
                  {place.name}
                </strong>

                {place.address && (
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: "#666",
                    }}
                  >
                    {place.address}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* STAYS */}

        {stays.map((place, index) => (
          <Marker
            key={`stay-${index}`}
            position={[
              place.latitude,
              place.longitude,
            ]}
            icon={stayIcon}
          >
            <Popup>
              <div style={{ minWidth: 190 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: ".12em",
                    color: "#8b5cf6",
                    marginBottom: 5,
                  }}
                >
                  STAY
                </div>

                <strong style={{ fontSize: 15 }}>
                  {place.name}
                </strong>

                {place.address && (
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: "#666",
                    }}
                  >
                    {place.address}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

/* --------------------------------------------------
   LEGEND COMPONENT
-------------------------------------------------- */

function Legend({
  color,
  label,
  border,
}: {
  color: string;
  label: string;
  border?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: color,
          border,
        }}
      />

      {label}
    </div>
  );
}