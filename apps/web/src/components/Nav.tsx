import Link from "next/link";
import AuthButton from "@/components/AuthButton";

export default function Nav() {
  return (
    <header className="marketplace-header">
      <div className="container marketplace-nav">
        <Link href="/" className="marketplace-brand">
          Infamous Freight
        </Link>
        <nav className="marketplace-links" aria-label="Marketplace">
          <Link href="/dashboard" className="nav-link">
            Dashboard
          </Link>
          <Link href="/loads" className="nav-link">
            Loads
          </Link>
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
