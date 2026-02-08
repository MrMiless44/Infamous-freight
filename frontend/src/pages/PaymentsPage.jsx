import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { paymentsApi } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CreditCard, Shield, Sparkles, Check, Loader2, AlertCircle } from 'lucide-react';

export default function PaymentsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const [packages, setPackages] = useState({});
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [processingPackage, setProcessingPackage] = useState(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (sessionId) {
      checkPaymentStatus(sessionId);
    }
  }, [sessionId]);

  const fetchData = async () => {
    try {
      const pkgRes = await paymentsApi.getPackages();
      setPackages(pkgRes.data?.packages || {});
      
      if (user) {
        const payRes = await paymentsApi.myPayments();
        setPayments(payRes.data?.transactions || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (sid, attempts = 0) => {
    if (attempts >= 5) {
      setPaymentResult({ status: 'timeout', message: 'Payment check timed out' });
      return;
    }
    
    setCheckingPayment(true);
    try {
      const res = await paymentsApi.getStatus(sid);
      if (res.data.payment_status === 'paid') {
        setPaymentResult({ status: 'success', message: 'Payment successful!' });
        fetchData();
      } else if (res.data.status === 'expired') {
        setPaymentResult({ status: 'expired', message: 'Session expired' });
      } else {
        setTimeout(() => checkPaymentStatus(sid, attempts + 1), 2000);
        return;
      }
    } catch (err) {
      setPaymentResult({ status: 'error', message: 'Failed to verify payment' });
    } finally {
      setCheckingPayment(false);
    }
  };

  const handlePurchase = async (packageId) => {
    if (!user) {
      window.location.href = '/sign-in';
      return;
    }
    
    setProcessingPackage(packageId);
    try {
      const res = await paymentsApi.createCheckout({
        package_id: packageId,
        origin_url: window.location.origin,
      });
      window.location.href = res.data.url;
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to start checkout');
    } finally {
      setProcessingPackage(null);
    }
  };

  const getPackageIcon = (id) => {
    if (id.includes('verified')) return Shield;
    if (id.includes('boost')) return Sparkles;
    return CreditCard;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold uppercase tracking-tight">
            Premium Services
          </h1>
          <p className="text-zinc-500 mt-1">Boost your loads and get verified</p>
        </div>

        {/* Payment Result */}
        {paymentResult && (
          <div className={`mb-8 p-6 rounded-sm border ${
            paymentResult.status === 'success' 
              ? 'bg-emerald-950/50 border-emerald-800 text-emerald-400'
              : 'bg-red-950/50 border-red-800 text-red-400'
          }`}>
            <div className="flex items-center gap-3">
              {paymentResult.status === 'success' ? (
                <Check className="h-6 w-6" />
              ) : (
                <AlertCircle className="h-6 w-6" />
              )}
              <span className="font-medium">{paymentResult.message}</span>
            </div>
          </div>
        )}

        {checkingPayment && (
          <div className="mb-8 p-6 bg-blue-950/50 border border-blue-800 rounded-sm text-blue-400">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Verifying your payment...</span>
            </div>
          </div>
        )}

        {/* Packages */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {Object.entries(packages).map(([id, pkg]) => {
            const Icon = getPackageIcon(id);
            const isVerified = id.includes('verified');
            
            return (
              <div
                key={id}
                className={`bg-[#121217] border rounded-sm p-6 ${
                  isVerified ? 'border-amber-800' : 'border-zinc-800'
                }`}
              >
                {isVerified && (
                  <div className="text-amber-500 text-xs font-mono uppercase tracking-wider mb-4">
                    Most Popular
                  </div>
                )}
                <div className={`p-3 rounded-sm w-fit mb-4 ${
                  isVerified ? 'bg-amber-500/10' : 'bg-zinc-800'
                }`}>
                  <Icon className={`h-6 w-6 ${isVerified ? 'text-amber-500' : 'text-zinc-400'}`} />
                </div>
                <h3 className="font-heading text-xl font-bold uppercase tracking-tight mb-2">
                  {pkg.name}
                </h3>
                <p className="text-zinc-500 text-sm mb-4">{pkg.description}</p>
                <p className="font-mono text-3xl font-bold text-amber-500 mb-6">
                  ${pkg.price}
                </p>
                <Button
                  onClick={() => handlePurchase(id)}
                  className={`w-full gap-2 ${isVerified ? '' : 'bg-zinc-800 hover:bg-zinc-700'}`}
                  disabled={processingPackage === id}
                  data-testid={`buy-${id}`}
                >
                  {processingPackage === id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Purchase
                </Button>
              </div>
            );
          })}
        </div>

        {/* Transaction History */}
        {user && payments.length > 0 && (
          <div>
            <h2 className="font-heading text-xl font-bold uppercase tracking-tight mb-4">
              Transaction History
            </h2>
            <div className="bg-[#121217] border border-zinc-800 rounded-sm divide-y divide-zinc-800">
              {payments.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{packages[tx.package_id]?.name || tx.package_id}</p>
                    <p className="text-zinc-500 text-sm font-mono">{tx.created_at?.slice(0, 10)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold">{formatMoney(tx.amount_cents)}</p>
                    <span className={`text-xs uppercase ${
                      tx.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {tx.payment_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!user && (
          <div className="bg-[#121217] border border-zinc-800 rounded-sm p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="font-heading text-xl font-bold uppercase mb-2">Sign In to Purchase</h2>
            <p className="text-zinc-500 mb-4">Create an account to access premium features</p>
            <Link to="/sign-in">
              <Button data-testid="payments-signin">Sign In</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
