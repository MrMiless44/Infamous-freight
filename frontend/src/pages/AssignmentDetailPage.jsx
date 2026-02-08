import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { assignmentsApi, loadsApi, trackingApi, documentsApi, ratingsApi, disputesApi } from '@/lib/api';
import { formatMoney, formatDate, formatDateTime, getStatusColor } from '@/lib/utils';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MapPin,
  Truck,
  DollarSign,
  MessageSquare,
  Upload,
  Star,
  AlertTriangle,
  Navigation,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export default function AssignmentDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [load, setLoad] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [latestLocation, setLatestLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [ratingOpen, setRatingOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Forms
  const [rating, setRating] = useState({ rating: 5, comment: '' });
  const [dispute, setDispute] = useState({ reason: undefined, description: '' });
  const [docType, setDocType] = useState('bol');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assignmentsRes] = await Promise.all([
        assignmentsApi.myAssignments(),
      ]);
      const a = assignmentsRes.data?.find((x) => x.id === id);
      if (!a) throw new Error('Not found');
      setAssignment(a);

      const loadRes = await loadsApi.get(a.load_id);
      setLoad(loadRes.data);

      const [docsRes, locRes] = await Promise.all([
        documentsApi.list(id),
        trackingApi.getLatest(id).catch(() => null),
      ]);
      setDocuments(docsRes.data?.documents || []);
      setLatestLocation(locRes?.data?.location);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async () => {
    setSubmitting(true);
    try {
      await ratingsApi.create({
        assignment_id: id,
        rating: rating.rating,
        comment: rating.comment || undefined,
      });
      setRatingOpen(false);
      alert('Rating submitted!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispute = async () => {
    setSubmitting(true);
    try {
      await disputesApi.create({
        assignment_id: id,
        reason: dispute.reason,
        description: dispute.description,
      });
      setDisputeOpen(false);
      alert('Dispute filed!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to file dispute');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setSubmitting(true);
    try {
      await documentsApi.upload(id, docType, file);
      setUploadOpen(false);
      setFile(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (status) => {
    try {
      await loadsApi.updateStatus(load.id, status);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold uppercase mb-2">Not Found</h1>
          <Link to="/dashboard"><Button>Go to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  const isShipper = user?.id === assignment.shipper_id;
  const isCarrier = user?.id === assignment.carrier_id;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className={`px-3 py-1 text-sm font-mono uppercase rounded-sm border ${getStatusColor(assignment.status)}`}>
              {assignment.status}
            </span>
            <span className={`px-3 py-1 text-sm font-mono uppercase rounded-sm border ${getStatusColor(assignment.escrow_status)}`}>
              Escrow: {assignment.escrow_status}
            </span>
          </div>
          {load && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-amber-500" />
              <span className="font-heading text-2xl font-bold uppercase">
                {load.pickup_city}, {load.pickup_state}
              </span>
              <span className="text-zinc-500">→</span>
              <MapPin className="h-5 w-5 text-emerald-500" />
              <span className="font-heading text-2xl font-bold uppercase">
                {load.dropoff_city}, {load.dropoff_state}
              </span>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Rate & Fees */}
            <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6">
              <h2 className="font-heading text-lg font-bold uppercase mb-4">Financials</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-zinc-500 text-sm">Booked Rate</p>
                  <p className="font-mono text-2xl font-bold text-amber-500">
                    {formatMoney(assignment.booked_rate_cents)}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 text-sm">Platform Fee</p>
                  <p className="font-mono text-xl text-red-400">
                    -{formatMoney(assignment.platform_fee_cents)}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 text-sm">Net Payout</p>
                  <p className="font-mono text-xl text-emerald-500">
                    {formatMoney(assignment.booked_rate_cents - assignment.platform_fee_cents)}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Updates */}
            {(isShipper || isCarrier) && load?.status !== 'delivered' && (
              <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6">
                <h2 className="font-heading text-lg font-bold uppercase mb-4">Update Status</h2>
                <div className="flex flex-wrap gap-3">
                  {load?.status === 'booked' && isCarrier && (
                    <Button onClick={() => updateStatus('in_transit')} className="gap-2" data-testid="start-transit-btn">
                      <Truck className="h-4 w-4" /> Start Transit
                    </Button>
                  )}
                  {load?.status === 'in_transit' && isCarrier && (
                    <Button onClick={() => updateStatus('delivered')} className="gap-2" data-testid="mark-delivered-btn">
                      <CheckCircle className="h-4 w-4" /> Mark Delivered
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Documents */}
            <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-heading text-lg font-bold uppercase">Documents</h2>
                <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2" data-testid="upload-doc-btn">
                      <Upload className="h-4 w-4" /> Upload
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-950 border-zinc-800">
                    <DialogHeader>
                      <DialogTitle>Upload Document</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Document Type</Label>
                        <Select value={docType} onValueChange={setDocType}>
                          <SelectTrigger className="bg-zinc-900 border-zinc-800">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-950 border-zinc-800">
                            <SelectItem value="bol">Bill of Lading (BOL)</SelectItem>
                            <SelectItem value="pod">Proof of Delivery (POD)</SelectItem>
                            <SelectItem value="insurance">Insurance Certificate</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>File</Label>
                        <Input type="file" onChange={(e) => setFile(e.target.files?.[0])} className="bg-zinc-900 border-zinc-800" />
                      </div>
                      <Button onClick={handleUpload} disabled={!file || submitting} className="w-full">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {documents.length === 0 ? (
                <p className="text-zinc-500 text-center py-4">No documents uploaded</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-sm">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-zinc-500" />
                        <div>
                          <p className="font-medium">{doc.filename}</p>
                          <p className="text-xs text-zinc-500 uppercase">{doc.doc_type}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tracking */}
            {latestLocation && (
              <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6">
                <h2 className="font-heading text-lg font-bold uppercase mb-4">Last Known Location</h2>
                <div className="flex items-center gap-4">
                  <Navigation className="h-6 w-6 text-emerald-500" />
                  <div>
                    <p className="font-mono">{latestLocation.lat.toFixed(4)}, {latestLocation.lng.toFixed(4)}</p>
                    <p className="text-zinc-500 text-sm">{formatDateTime(latestLocation.created_at)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6 space-y-3">
              <Link to={`/messages?load=${assignment.load_id}`}>
                <Button variant="outline" className="w-full gap-2" data-testid="open-messages">
                  <MessageSquare className="h-4 w-4" /> Messages
                </Button>
              </Link>

              {assignment.status === 'completed' && (
                <Dialog open={ratingOpen} onOpenChange={setRatingOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full gap-2" data-testid="rate-btn">
                      <Star className="h-4 w-4" /> Rate {isShipper ? 'Carrier' : 'Shipper'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-950 border-zinc-800">
                    <DialogHeader>
                      <DialogTitle>Leave a Rating</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Rating</Label>
                        <Select value={String(rating.rating)} onValueChange={(v) => setRating({ ...rating, rating: parseInt(v) })}>
                          <SelectTrigger className="bg-zinc-900 border-zinc-800">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-950 border-zinc-800">
                            {[5, 4, 3, 2, 1].map((r) => (
                              <SelectItem key={r} value={String(r)}>{'⭐'.repeat(r)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Comment (optional)</Label>
                        <Textarea
                          value={rating.comment}
                          onChange={(e) => setRating({ ...rating, comment: e.target.value })}
                          className="bg-zinc-900 border-zinc-800"
                        />
                      </div>
                      <Button onClick={handleRate} disabled={submitting} className="w-full">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Rating'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full gap-2 text-red-400 hover:text-red-300" data-testid="dispute-btn">
                    <AlertTriangle className="h-4 w-4" /> File Dispute
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-950 border-zinc-800">
                  <DialogHeader>
                    <DialogTitle>File a Dispute</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Reason</Label>
                      <Select value={dispute.reason} onValueChange={(v) => setDispute({ ...dispute, reason: v })}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-800">
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-zinc-800">
                          <SelectItem value="non_payment">Non-Payment</SelectItem>
                          <SelectItem value="damaged_goods">Damaged Goods</SelectItem>
                          <SelectItem value="late_delivery">Late Delivery</SelectItem>
                          <SelectItem value="no_show">No Show</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={dispute.description}
                        onChange={(e) => setDispute({ ...dispute, description: e.target.value })}
                        placeholder="Describe the issue..."
                        className="bg-zinc-900 border-zinc-800 min-h-[100px]"
                      />
                    </div>
                    <Button onClick={handleDispute} disabled={!dispute.reason || !dispute.description || submitting} className="w-full">
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Dispute'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
