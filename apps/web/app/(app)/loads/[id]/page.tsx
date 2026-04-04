import Link from 'next/link';
import StatusBadge from '../../../_components/StatusBadge';
import Timeline from '../../../_components/Timeline';
import { loads, carriers, drivers, invoices, documents } from '../../../_data/mock-data';
import type { Load, LoadStatus } from '../../../_data/mock-data';

const equipmentLabels: Record<string, string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step Deck',
  tanker: 'Tanker',
  intermodal: 'Intermodal',
  box_truck: 'Box Truck',
  ltl: 'LTL',
};

const statusToBadge: Record<LoadStatus, string> = {
  draft: 'pending',
  posted: 'pending',
  assigned: 'assigned',
  picked_up: 'at_pickup',
  in_transit: 'in_transit',
  delivered: 'delivered',
  delayed: 'delayed',
  cancelled: 'cancelled',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
}

function formatWeight(weight: number): string {
  return new Intl.NumberFormat('en-US').format(weight) + ' lbs';
}

function getTimelineSteps(load: Load) {
  const statusOrder: LoadStatus[] = ['draft', 'posted', 'assigned', 'picked_up', 'in_transit', 'delivered'];
  const currentIndex = statusOrder.indexOf(load.status);

  const steps = [
    { label: 'Order Created', time: load.createdAt, completed: currentIndex >= 0, active: false },
    { label: 'Carrier Assigned', time: load.carrier ? load.updatedAt : undefined, completed: currentIndex >= 2, active: currentIndex === 2 },
    { label: 'Picked Up', time: currentIndex >= 3 ? load.pickupDate : undefined, completed: currentIndex >= 3, active: currentIndex === 3 },
    { label: 'In Transit', time: currentIndex >= 4 ? load.pickupDate : undefined, completed: currentIndex >= 4, active: currentIndex === 4 },
    { label: 'Delivered', time: currentIndex >= 5 ? load.deliveryDate : undefined, completed: currentIndex >= 5, active: false },
  ];

  if (load.status === 'delayed') {
    const delayedIndex = steps.findIndex((s) => !s.completed);
    if (delayedIndex > 0) {
      steps[delayedIndex - 1].active = true;
    }
  }

  return steps;
}

export default async function LoadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const load = loads.find((l) => l.id === id);

  if (!load) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-xl font-semibold text-white">Load Not Found</h1>
        <p className="mt-2 text-sm text-slate-400">The load &quot;{id}&quot; does not exist.</p>
        <Link href="/loads" className="mt-4 text-sm font-medium text-blue-400 hover:text-blue-300">
          Back to Loads
        </Link>
      </div>
    );
  }

  const carrier = load.carrier ? carriers.find((c) => c.id === load.carrier!.id) : null;
  const driver = load.driver ? drivers.find((d) => d.id === load.driver!.id) : null;
  const relatedInvoices = invoices.filter((inv) => inv.loadId === load.id);
  const relatedDocs = documents.filter((doc) => doc.loadId === load.id);
  const timelineSteps = getTimelineSteps(load);

  const bolDoc = relatedDocs.find((d) => d.type === 'bol');
  const podDoc = relatedDocs.find((d) => d.type === 'pod');

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div>
        <Link
          href="/loads"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-200"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Loads
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">{load.loadNumber}</h1>
          <StatusBadge status={statusToBadge[load.status] as never} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/loads/${load.id}/edit`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M10 1.5l2.5 2.5M1.5 12.5l.83-3.33L9.67 1.83a1 1 0 011.41 0l1.09 1.09a1 1 0 010 1.41L4.83 11.67 1.5 12.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Edit Load
          </Link>
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v4M5 3h4M2 6h10v6a1 1 0 01-1 1H3a1 1 0 01-1-1V6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Assign Carrier
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M4 1v2M10 1v2M1 5h12M2 3h10a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Print BOL
          </button>
          {load.status !== 'delivered' && load.status !== 'cancelled' && (
            <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-500">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Mark Delivered
            </button>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Load details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Load details card */}
          <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Load Details</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Shipper</p>
                  <p className="mt-1 text-sm text-slate-200">{load.shipper.name}</p>
                  <p className="text-xs text-slate-400">Contact: {load.shipper.contact}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Origin</p>
                  <p className="mt-1 text-sm text-slate-200">{load.origin.address}</p>
                  <p className="text-xs text-slate-400">{load.origin.city}, {load.origin.state} {load.origin.zip}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Pickup Date</p>
                  <p className="mt-1 text-sm text-slate-200">{load.pickupDate}</p>
                  <p className="text-xs text-slate-400">Window: {load.pickupWindow}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Equipment Type</p>
                  <p className="mt-1 text-sm text-slate-200">{equipmentLabels[load.equipmentType]}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Commodity</p>
                  <p className="mt-1 text-sm text-slate-200">{load.commodity}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Rate</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-400">{formatCurrency(load.rate)}</p>
                  <p className="text-xs text-slate-400">${(load.rate / load.distance).toFixed(2)}/mi</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Destination</p>
                  <p className="mt-1 text-sm text-slate-200">{load.destination.address}</p>
                  <p className="text-xs text-slate-400">{load.destination.city}, {load.destination.state} {load.destination.zip}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Delivery Date</p>
                  <p className="mt-1 text-sm text-slate-200">{load.deliveryDate}</p>
                  <p className="text-xs text-slate-400">Window: {load.deliveryWindow}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Weight / Distance</p>
                  <p className="mt-1 text-sm text-slate-200">{formatWeight(load.weight)}</p>
                  <p className="text-xs text-slate-400">{load.distance.toLocaleString()} miles</p>
                </div>
                {load.bolNumber && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">BOL Number</p>
                    <p className="mt-1 text-sm text-slate-200">{load.bolNumber}</p>
                  </div>
                )}
              </div>
            </div>
            {load.notes && (
              <div className="mt-4 border-t border-slate-800 pt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Notes</p>
                <p className="mt-1 text-sm text-slate-300">{load.notes}</p>
              </div>
            )}
            {load.delayReason && (
              <div className="mt-4 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">Delay Reason</p>
                <p className="mt-1 text-sm text-orange-300">{load.delayReason}</p>
              </div>
            )}
          </div>

          {/* Map placeholder */}
          <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Route Map</h2>
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-800/30">
              <div className="text-center">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mx-auto text-slate-600">
                  <path d="M20 4C13.4 4 8 9.4 8 16c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12zm0 16a4 4 0 110-8 4 4 0 010 8z" stroke="currentColor" strokeWidth="2" />
                </svg>
                <p className="mt-2 text-sm text-slate-500">
                  {load.origin.city}, {load.origin.state} to {load.destination.city}, {load.destination.state}
                </p>
                <p className="text-xs text-slate-600">{load.distance.toLocaleString()} miles</p>
              </div>
            </div>
          </div>

          {/* Related invoices */}
          {relatedInvoices.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Related Invoices</h2>
              <div className="space-y-3">
                {relatedInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/30 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-blue-400">{inv.invoiceNumber}</p>
                      <p className="text-xs text-slate-400">Issued: {inv.issuedDate} | Due: {inv.dueDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-200">{formatCurrency(inv.amount)}</p>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          inv.status === 'paid'
                            ? 'bg-emerald-400/10 text-emerald-400'
                            : inv.status === 'overdue'
                              ? 'bg-red-400/10 text-red-400'
                              : inv.status === 'invoiced'
                                ? 'bg-blue-400/10 text-blue-400'
                                : 'bg-yellow-400/10 text-yellow-400'
                        }`}
                      >
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Assignment card */}
          <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Assignment</h2>
            {carrier ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Carrier</p>
                  <p className="mt-1 text-sm font-medium text-slate-200">{carrier.name}</p>
                  <p className="text-xs text-slate-400">MC# {carrier.mcNumber} | DOT# {carrier.dotNumber}</p>
                  <p className="text-xs text-slate-400">{carrier.phone}</p>
                </div>
                {driver && (
                  <div className="border-t border-slate-800 pt-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Driver</p>
                    <p className="mt-1 text-sm font-medium text-slate-200">{driver.name}</p>
                    <p className="text-xs text-slate-400">{driver.phone}</p>
                    <p className="text-xs text-slate-400">{driver.truck}</p>
                    {driver.location && (
                      <p className="mt-1 text-xs text-blue-400">
                        Current: {driver.location.city}, {driver.location.state}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-700 bg-slate-800/20 p-4 text-center">
                <p className="text-sm text-slate-500">No carrier assigned</p>
                <button className="mt-2 text-xs font-medium text-blue-400 hover:text-blue-300">
                  Assign Carrier
                </button>
              </div>
            )}
          </div>

          {/* Timeline card */}
          <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Timeline</h2>
            <Timeline steps={timelineSteps} />
          </div>

          {/* Documents card */}
          <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Documents</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-slate-400">
                    <path d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5L9 1z" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M9 1v4h4" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                  <div>
                    <p className="text-sm text-slate-200">Bill of Lading (BOL)</p>
                    <p className="text-xs text-slate-500">{load.bolNumber || 'Not generated'}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    bolDoc ? 'bg-emerald-400/10 text-emerald-400' : 'bg-yellow-400/10 text-yellow-400'
                  }`}
                >
                  {bolDoc ? 'Uploaded' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-slate-400">
                    <path d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5L9 1z" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M9 1v4h4" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                  <div>
                    <p className="text-sm text-slate-200">Proof of Delivery (POD)</p>
                    <p className="text-xs text-slate-500">{load.podStatus}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    load.podStatus === 'verified'
                      ? 'bg-emerald-400/10 text-emerald-400'
                      : load.podStatus === 'uploaded'
                        ? 'bg-blue-400/10 text-blue-400'
                        : load.podStatus === 'missing'
                          ? 'bg-red-400/10 text-red-400'
                          : 'bg-yellow-400/10 text-yellow-400'
                  }`}
                >
                  {load.podStatus.charAt(0).toUpperCase() + load.podStatus.slice(1)}
                </span>
              </div>
              {relatedDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-slate-400">
                      <path d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5L9 1z" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M9 1v4h4" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                    <div>
                      <p className="text-sm text-slate-200">{doc.name}</p>
                      <p className="text-xs text-slate-500">{doc.fileSize}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                    {doc.status === 'valid' ? 'Valid' : doc.status === 'pending_review' ? 'Review' : 'Expired'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
