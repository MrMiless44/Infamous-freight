import { Link } from 'react-router-dom';
import { formatMoney, formatDate, getStatusColor } from '@/lib/utils';
import { MapPin, Calendar, Truck, Weight, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const LoadCard = ({ load, showActions = true }) => {
  return (
    <div
      className="bg-[#121217] border border-zinc-800 rounded-sm p-6 hover:border-zinc-600 transition-colors duration-300 animate-fade-in"
      data-testid={`load-card-${load.id}`}
    >
      {/* Premium Badge */}
      {load.is_premium && (
        <div className="flex items-center gap-2 mb-3 text-amber-500">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-mono uppercase tracking-wider">Featured Listing</span>
        </div>
      )}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Route Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-500" />
              <span className="font-heading text-lg font-bold uppercase tracking-tight">
                {load.pickup_city}, {load.pickup_state}
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-500" />
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-500" />
              <span className="font-heading text-lg font-bold uppercase tracking-tight">
                {load.dropoff_city}, {load.dropoff_state}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span className="font-mono">
                {formatDate(load.pickup_date)} → {formatDate(load.dropoff_date)}
              </span>
            </div>
            {load.equipment && (
              <div className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" />
                <span className="uppercase text-xs tracking-wider">{load.equipment}</span>
              </div>
            )}
            {load.weight_lbs && (
              <div className="flex items-center gap-1.5">
                <Weight className="h-3.5 w-3.5" />
                <span className="font-mono">{load.weight_lbs.toLocaleString()} lbs</span>
              </div>
            )}
          </div>

          {load.commodity && (
            <p className="text-sm text-zinc-500 mt-2">{load.commodity}</p>
          )}
        </div>

        {/* Rate & Status */}
        <div className="flex lg:flex-col items-center lg:items-end gap-4">
          <div
            className={`px-2 py-0.5 text-xs font-mono uppercase tracking-wider rounded-sm border ${getStatusColor(
              load.status
            )}`}
          >
            {load.status.replace('_', ' ')}
          </div>
          <div className="text-right">
            <p className="font-mono text-xl font-bold text-amber-500">
              {formatMoney(load.target_rate_cents)}
            </p>
            <p className="text-xs text-zinc-500">Target Rate</p>
          </div>
        </div>
      </div>

      {showActions && (
        <div className="flex justify-end mt-4 pt-4 border-t border-zinc-800">
          <Link to={`/loads/${load.id}`}>
            <Button variant="outline" className="gap-2" data-testid={`view-load-${load.id}`}>
              View Details
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};
