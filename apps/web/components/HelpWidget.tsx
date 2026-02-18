/**
 * Help Center Widget - Always Accessible Help
 * Floating button with contextual help and quick access to documentation
 */

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "./HelpWidget.module.css";

interface HelpArticle {
  title: string;
  href: string;
}

const commonHelp: Record<string, HelpArticle[]> = {
  "/dashboard": [
    { title: "Understanding Your Dashboard", href: "/docs/dashboard" },
    { title: "Key Metrics Explained", href: "/docs/metrics" },
    { title: "Quick Actions Guide", href: "/docs/quick-actions" },
  ],
  "/shipments": [
    { title: "Creating a New Shipment", href: "/docs/create-shipment" },
    { title: "Tracking Shipments", href: "/docs/tracking" },
    { title: "Managing Shipment Status", href: "/docs/shipment-status" },
  ],
  "/fleet": [
    { title: "Adding Vehicles", href: "/docs/add-vehicle" },
    { title: "Driver Management", href: "/docs/drivers" },
    { title: "Vehicle Maintenance", href: "/docs/maintenance" },
  ],
};

export const HelpWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const contextualHelp = commonHelp[router.pathname] || [];

  return (
    <>
      {/* Help Button */}
      <button
        className={styles.helpButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Help and Support"
        aria-expanded={isOpen}
      >
        <span className={styles.helpIcon}>?</span>
      </button>

      {/* Help Panel */}
      {isOpen && (
        <div className={styles.helpPanel} role="dialog" aria-label="Help center">
          <div className={styles.helpHeader}>
            <h3 className={styles.helpTitle}>How can we help?</h3>
            <button
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close help panel"
            >
              ✕
            </button>
          </div>

          <div className={styles.helpContent}>
            {/* Search */}
            <div className={styles.helpSearch}>
              <input
                type="search"
                placeholder="Search help articles..."
                className={styles.searchInput}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const query = (e.target as HTMLInputElement).value;
                    router.push(`/docs/search?q=${encodeURIComponent(query)}`);
                    setIsOpen(false);
                  }
                }}
              />
            </div>

            {/* Contextual Help */}
            {contextualHelp.length > 0 && (
              <>
                <div className={styles.helpSection}>
                  <h4 className={styles.sectionTitle}>Help for this page</h4>
                  <ul className={styles.helpList}>
                    {contextualHelp.map((article) => (
                      <li key={article.href}>
                        <Link href={article.href} className={styles.helpLink}>
                          📄 {article.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={styles.divider} />
              </>
            )}

            {/* Quick Links */}
            <div className={styles.helpSection}>
              <h4 className={styles.sectionTitle}>Quick Links</h4>
              <ul className={styles.helpList}>
                <li>
                  <Link href="/docs" className={styles.helpLink}>
                    📚 Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/docs/getting-started" className={styles.helpLink}>
                    🚀 Getting Started
                  </Link>
                </li>
                <li>
                  <Link href="/docs/faq" className={styles.helpLink}>
                    ❓ Frequently Asked Questions
                  </Link>
                </li>
                <li>
                  <Link href="/docs/video-tutorials" className={styles.helpLink}>
                    🎥 Video Tutorials
                  </Link>
                </li>
              </ul>
            </div>

            <div className={styles.divider} />

            {/* Contact Support */}
            <div className={styles.helpSection}>
              <h4 className={styles.sectionTitle}>Need More Help?</h4>
              <Link href="/support" className={styles.contactButton}>
                💬 Contact Support
                </Link>
              <div className={styles.supportInfo}>
                <p className={styles.supportText}>
                  📧 Email: support@infamousfreight.com
                </p>
                <p className={styles.supportText}>
                  📞 Phone: 1-800-FREIGHT (24/7)
                </p>
                <p className={styles.supportText}>
                  ⏱️ Avg. response time: &lt;1 hour
                </p>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className={styles.divider} />
            <div className={styles.helpSection}>
              <h4 className={styles.sectionTitle}>Keyboard Shortcuts</h4>
              <div className={styles.shortcuts}>
                <div className={styles.shortcut}>
                  <kbd className={styles.kbd}>?</kbd>
                  <span>Open help</span>
                </div>
                <div className={styles.shortcut}>
                  <kbd className={styles.kbd}>Ctrl</kbd> + <kbd className={styles.kbd}>K</kbd>
                  <span>Search</span>
                </div>
                <div className={styles.shortcut}>
                  <kbd className={styles.kbd}>G</kbd> then{" "}
                  <kbd className={styles.kbd}>D</kbd>
                  <span>Go to Dashboard</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div className={styles.backdrop} onClick={() => setIsOpen(false)} aria-hidden="true" />
      )}
    </>
  );
};

export default HelpWidget;
