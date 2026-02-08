import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Shield, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [form, setForm] = useState({
    display_name: user?.display_name || '',
    company_name: user?.company_name || '',
    phone: user?.phone || '',
    dot_number: user?.dot_number || '',
    mc_number: user?.mc_number || '',
    home_city: user?.home_city || '',
    home_state: user?.home_state || '',
  });

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const res = await authApi.updateProfile(form);
      updateUser(res.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold uppercase mb-2">Sign In Required</h1>
          <Link to="/sign-in"><Button>Sign In</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold uppercase tracking-tight">Profile</h1>
          <p className="text-zinc-500 mt-1">Manage your account information</p>
        </div>

        {/* Verification Badge */}
        <div className={`mb-6 p-4 rounded-sm border ${
          user.is_verified 
            ? 'bg-emerald-950/50 border-emerald-800' 
            : 'bg-zinc-900 border-zinc-800'
        }`}>
          <div className="flex items-center gap-3">
            <Shield className={`h-6 w-6 ${user.is_verified ? 'text-emerald-500' : 'text-zinc-500'}`} />
            <div>
              <p className={`font-medium ${user.is_verified ? 'text-emerald-400' : 'text-zinc-400'}`}>
                {user.is_verified ? 'Verified Carrier' : 'Not Verified'}
              </p>
              {user.is_verified && user.verified_until && (
                <p className="text-sm text-zinc-500">Valid until {user.verified_until.slice(0, 10)}</p>
              )}
            </div>
            {!user.is_verified && user.role === 'carrier' && (
              <Link to="/payments" className="ml-auto">
                <Button size="sm">Get Verified</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Rating */}
        {user.rating && (
          <div className="mb-6 p-4 bg-[#121217] border border-zinc-800 rounded-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⭐</span>
              <div>
                <p className="font-heading text-xl font-bold">{user.rating.toFixed(1)}</p>
                <p className="text-zinc-500 text-sm">{user.rating_count} ratings</p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-800 rounded-sm text-red-400 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-950/50 border border-emerald-800 rounded-sm text-emerald-400 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" /> Profile updated successfully!
          </div>
        )}

        {/* Form */}
        <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                className="bg-zinc-950 border-zinc-800"
                data-testid="profile-display-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                className="bg-zinc-950 border-zinc-800"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="555-123-4567"
              className="bg-zinc-950 border-zinc-800"
            />
          </div>

          {(user.role === 'carrier' || user.role === 'driver') && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>DOT Number</Label>
                <Input
                  value={form.dot_number}
                  onChange={(e) => setForm({ ...form, dot_number: e.target.value })}
                  className="bg-zinc-950 border-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <Label>MC Number</Label>
                <Input
                  value={form.mc_number}
                  onChange={(e) => setForm({ ...form, mc_number: e.target.value })}
                  className="bg-zinc-950 border-zinc-800"
                />
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Home City</Label>
              <Input
                value={form.home_city}
                onChange={(e) => setForm({ ...form, home_city: e.target.value })}
                className="bg-zinc-950 border-zinc-800"
              />
            </div>
            <div className="space-y-2">
              <Label>Home State</Label>
              <Input
                value={form.home_state}
                onChange={(e) => setForm({ ...form, home_state: e.target.value })}
                placeholder="TX"
                className="bg-zinc-950 border-zinc-800"
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full gap-2" data-testid="save-profile-btn">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>

        {/* Account Info */}
        <div className="mt-6 p-4 bg-zinc-900/50 border border-zinc-800 rounded-sm">
          <p className="text-zinc-500 text-sm">Email: <span className="text-zinc-300 font-mono">{user.email}</span></p>
          <p className="text-zinc-500 text-sm mt-1">Role: <span className="text-amber-500 uppercase">{user.role}</span></p>
          <p className="text-zinc-500 text-sm mt-1">Member since: <span className="text-zinc-300 font-mono">{user.created_at?.slice(0, 10)}</span></p>
        </div>
      </div>
    </div>
  );
}
