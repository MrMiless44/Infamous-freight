import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { loadsApi, bidsApi, assignmentsApi, messagesApi } from '@/lib/api';
import { formatMoney, formatDate, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  MapPin,
  Calendar,
  Truck,
  Weight,
  ArrowRight,
  Loader2,
  AlertCircle,
  Gavel,
  DollarSign,
  MessageSquare,
  User,
  CheckCircle,
} from 'lucide-react';

export default function LoadDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [load, setLoad] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [bidLoading, setBidLoading] = useState(false);
  const [bidError, setBidError] = useState(null);

  const [bookingLoading, setBookingLoading] = useState(null);

  const isOwner = user && load?.created_by === user.id;
  const canBid = user && !isOwner && load?.status === 'posted';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const loadRes = await loadsApi.get(id);
        setLoad(loadRes.data);

        if (user) {
          try {
            const bidsRes = await bidsApi.getLoadBids(id);
            setBids(bidsRes.data || []);
          } catch {
            // User might not have access to bids
          }
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  const handleBid = async (e) => {
    e.preventDefault();
    setBidError(null);
    setBidLoading(true);

    try {
      const res = await bidsApi.create({
        load_id: id,
        offer_rate_cents: parseInt(bidAmount) * 100,
        message: bidMessage || undefined,
      });
      setBids((prev) => [res.data, ...prev]);
      setBidDialogOpen(false);
      setBidAmount('');
      setBidMessage('');
    } catch (err) {
      setBidError(err.response?.data?.detail || 'Failed to submit bid');
    } finally {
      setBidLoading(false);
    }
  };

  const handleBook = async (bid) => {
    setBookingLoading(bid.id);
    try {
      await assignmentsApi.book({
        load_id: id,
        bid_id: bid.id,
      });
      // Reload data
      const loadRes = await loadsApi.get(id);
      setLoad(loadRes.data);
      const bidsRes = await bidsApi.getLoadBids(id);
      setBids(bidsRes.data || []);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to book');
    } finally {
      setBookingLoading(null);
    }
  };

  const goToMessages = async () => {
    navigate(`/messages?load=${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error || !load) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold uppercase mb-2">Load Not Found</h1>
          <p className="text-zinc-500 mb-4">{error || 'This load does not exist.'}</p>
          <Link to="/loads">
            <Button>Browse Loads</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span
              className={`px-3 py-1 text-sm font-mono uppercase tracking-wider rounded-sm border ${getStatusColor(
                load.status
              )}`}
            >
              {load.status.replace('_', ' ')}
            </span>
            <span className="text-zinc-500 font-mono text-sm">
              ID: {load.id.slice(0, 8)}...
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-amber-500" />
              <span className="font-heading text-2xl font-bold uppercase tracking-tight">
                {load.pickup_city}, {load.pickup_state}
              </span>
            </div>
            <ArrowRight className="h-5 w-5 text-zinc-500" />
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-500" />
              <span className="font-heading text-2xl font-bold uppercase tracking-tight">
                {load.dropoff_city}, {load.dropoff_state}
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Load Info */}
            <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6">
              <h2 className="font-heading text-lg font-bold uppercase tracking-tight mb-4">
                Load Details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-zinc-500 text-sm">Pickup Date</p>
                  <p className="font-mono">{formatDate(load.pickup_date)}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-sm">Dropoff Date</p>
                  <p className="font-mono">{formatDate(load.dropoff_date)}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-sm">Equipment</p>
                  <p className="uppercase">{load.equipment || '—'}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-sm">Weight</p>
                  <p className="font-mono">
                    {load.weight_lbs ? `${load.weight_lbs.toLocaleString()} lbs` : '—'}
                  </p>
                </div>
              </div>

              {load.commodity && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <p className="text-zinc-500 text-sm">Commodity</p>
                  <p>{load.commodity}</p>
                </div>
              )}

              {load.notes && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <p className="text-zinc-500 text-sm">Notes</p>
                  <p className="text-zinc-300">{load.notes}</p>
                </div>
              )}
            </div>

            {/* Bids Section */}
            {user && (
              <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-heading text-lg font-bold uppercase tracking-tight">
                    Bids ({bids.length})
                  </h2>
                  {canBid && (
                    <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2" data-testid="place-bid-btn">
                          <Gavel className="h-4 w-4" />
                          Place Bid
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-zinc-950 border-zinc-800">
                        <DialogHeader>
                          <DialogTitle className="font-heading uppercase tracking-tight">
                            Place Your Bid
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleBid} className="space-y-4">
                          {bidError && (
                            <div className="flex items-center gap-2 p-3 bg-red-950/50 border border-red-800 rounded-sm text-red-400 text-sm">
                              <AlertCircle className="h-4 w-4" />
                              {bidError}
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label>Your Offer ($)</Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                              <Input
                                type="number"
                                value={bidAmount}
                                onChange={(e) => setBidAmount(e.target.value)}
                                placeholder="2500"
                                className="bg-zinc-900 border-zinc-800 pl-9"
                                required
                                data-testid="bid-amount-input"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Message (optional)</Label>
                            <Textarea
                              value={bidMessage}
                              onChange={(e) => setBidMessage(e.target.value)}
                              placeholder="Why you're the best choice..."
                              className="bg-zinc-900 border-zinc-800"
                              data-testid="bid-message-input"
                            />
                          </div>
                          <Button
                            type="submit"
                            className="w-full"
                            disabled={bidLoading}
                            data-testid="submit-bid-btn"
                          >
                            {bidLoading ? 'Submitting...' : 'Submit Bid'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {bids.length === 0 ? (
                  <p className="text-zinc-500 text-center py-8">No bids yet.</p>
                ) : (
                  <div className="space-y-3">
                    {bids.map((bid) => (
                      <div
                        key={bid.id}
                        className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-sm"
                        data-testid={`bid-${bid.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-800 rounded-sm">
                            <User className="h-4 w-4 text-zinc-400" />
                          </div>
                          <div>
                            <p className="font-medium">{bid.carrier_name || 'Carrier'}</p>
                            {bid.message && (
                              <p className="text-zinc-500 text-sm mt-1">{bid.message}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-mono text-lg font-bold text-amber-500">
                              {formatMoney(bid.offer_rate_cents)}
                            </p>
                            <span
                              className={`text-xs font-mono uppercase ${getStatusColor(
                                bid.status
                              )} px-2 py-0.5 rounded-sm border`}
                            >
                              {bid.status}
                            </span>
                          </div>
                          {isOwner && bid.status === 'submitted' && load.status === 'posted' && (
                            <Button
                              onClick={() => handleBook(bid)}
                              disabled={bookingLoading === bid.id}
                              className="gap-1"
                              data-testid={`accept-bid-${bid.id}`}
                            >
                              {bookingLoading === bid.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                              Accept
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rate Card */}
            <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6">
              <p className="text-zinc-500 text-sm mb-1">Target Rate</p>
              <p className="font-mono text-3xl font-bold text-amber-500">
                {formatMoney(load.target_rate_cents)}
              </p>
            </div>

            {/* Posted By */}
            <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6">
              <p className="text-zinc-500 text-sm mb-2">Posted By</p>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-sm">
                  <User className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium">{load.created_by_name || 'Shipper'}</p>
                  <p className="text-zinc-500 text-xs font-mono">
                    {formatDate(load.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6 space-y-3">
              {user ? (
                <>
                  {load.status !== 'posted' && (
                    <Button
                      onClick={goToMessages}
                      className="w-full gap-2"
                      variant="outline"
                      data-testid="open-messages-btn"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Open Messages
                    </Button>
                  )}
                  {canBid && (
                    <Button
                      onClick={() => setBidDialogOpen(true)}
                      className="w-full gap-2"
                      data-testid="sidebar-bid-btn"
                    >
                      <Gavel className="h-4 w-4" />
                      Place Bid
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <p className="text-zinc-500 text-sm mb-3">Sign in to bid or message</p>
                  <Link to="/sign-in">
                    <Button className="w-full" data-testid="detail-signin-btn">Sign In</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
