const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/loads", label: "Loads" },
  { href: "/genesis", label: "Genesis" },
  { href: "/billing", label: "Billing" },
  { href: "/insurance", label: "Insurance" },
  { href: "/settings", label: "Settings" },
];

export function SideNav() {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="mb-4">
        <div className="text-lg font-semibold">Infæmous Freight</div>
        <div className="text-xs text-muted">Enterprise Ops Console</div>
      </div>

      <nav className="space-y-1">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="block rounded-2xl px-3 py-2 text-sm text-muted transition duration-base ease-premium hover:bg-white/5 hover:text-text"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className="mt-4 rounded-2xl bg-white/5 p-3">
        <div className="text-xs text-muted">Genesis Status</div>
        <div className="mt-1 text-sm">
          <span className="text-success-500">●</span> Online
        </div>
      </div>
    </div>
  );
}
