import Link from "next/link";

export default function Home() {
  return (
    <section className="marketplace-hero">
      <div className="marketplace-hero-content">
        <h1 className="marketplace-title">Infamous Freight</h1>
        <p className="marketplace-subtitle">
          Post loads, bid like DoorDash (Get Truck'N), dispatch faster, and summarize threads with AI.
        </p>
        <div className="marketplace-actions">
          <Link className="btn btn-primary" href="/dashboard">
            Go to Dashboard
          </Link>
          <Link className="btn btn-secondary" href="/loads">
            Browse Loads
          </Link>
        </div>
      </div>
    </section>
  );
}
