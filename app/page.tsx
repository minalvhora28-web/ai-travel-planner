import Link from "next/link";

export default function Home() {
  return (
    <main
      className="planner-page"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <section className="planner-card" style={{ textAlign: "center" }}>
        <div className="hero-icon">✈️</div>

        <div className="planner-hero">
          <h1>AI Travel Planner</h1>
          <p>Plan your perfect trip with AI</p>
        </div>

        <Link
          href="/planner"
          className="generate-button"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
          }}
        >
          Start Planning
        </Link>
      </section>
    </main>
  );
}
