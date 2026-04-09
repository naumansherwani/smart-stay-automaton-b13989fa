import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Wallet, TrendingUp, Clock, CheckCircle, ArrowDownToLine, DollarSign, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Earning {
  id: string;
  amount: number;
  source: string;
  description: string | null;
  status: string;
  created_at: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  processed_at: string | null;
}

const Earnings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [accountDetails, setAccountDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const totalEarnings = earnings.filter(e => e.status === 'cleared').reduce((sum, e) => sum + Number(e.amount), 0);
  const pendingEarnings = earnings.filter(e => e.status === 'pending').reduce((sum, e) => sum + Number(e.amount), 0);
  const totalWithdrawn = withdrawals.filter(w => w.status === 'completed').reduce((sum, w) => sum + Number(w.amount), 0);
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending' || w.status === 'processing').reduce((sum, w) => sum + Number(w.amount), 0);
  const availableBalance = totalEarnings - totalWithdrawn - pendingWithdrawals;

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [earningsRes, withdrawalsRes] = await Promise.all([
      supabase.from('user_earnings').select('*').order('created_at', { ascending: false }),
      supabase.from('withdrawal_requests').select('*').order('created_at', { ascending: false }),
    ]);
    if (earningsRes.data) setEarnings(earningsRes.data as Earning[]);
    if (withdrawalsRes.data) setWithdrawals(withdrawalsRes.data as Withdrawal[]);
    setLoading(false);
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > availableBalance) {
      toast.error("Insufficient balance");
      return;
    }
    if (!accountDetails.trim()) {
      toast.error("Please provide payment account details");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('withdrawal_requests').insert({
      user_id: user!.id,
      amount,
      payment_method: paymentMethod,
      payment_details: { account_info: accountDetails },
    });

    if (error) {
      toast.error("Failed to submit withdrawal request");
    } else {
      toast.success("Withdrawal request submitted! We'll process it within 3-5 business days.");
      setWithdrawOpen(false);
      setWithdrawAmount("");
      setAccountDetails("");
      fetchData();
    }
    setSubmitting(false);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': case 'cleared': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'processing': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Logo size="lg" showName />
            <span className="text-lg font-bold text-foreground">Earnings & Withdrawals</span>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-4xl space-y-6">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Wallet className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Available</span>
              </div>
              <p className="text-2xl font-extrabold text-foreground">${availableBalance.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Total Earned</span>
              </div>
              <p className="text-2xl font-extrabold text-foreground">${totalEarnings.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2 text-yellow-400">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Pending</span>
              </div>
              <p className="text-2xl font-extrabold text-foreground">${pendingEarnings.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2 text-blue-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Withdrawn</span>
              </div>
              <p className="text-2xl font-extrabold text-foreground">${totalWithdrawn.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Withdraw Button */}
        <div className="flex justify-end">
          <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)] text-white font-semibold gap-2">
                <ArrowDownToLine className="w-4 h-4" /> Withdraw Funds
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" /> Request Withdrawal
                </DialogTitle>
                <DialogDescription>
                  Available balance: <strong>${availableBalance.toFixed(2)}</strong>. Withdrawals are processed within 3-5 business days.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label>Amount ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="1"
                    max={availableBalance}
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="stripe">Stripe Payout</SelectItem>
                      <SelectItem value="wise">Wise</SelectItem>
                      <SelectItem value="payoneer">Payoneer</SelectItem>
                      <SelectItem value="easypaisa">Easypaisa</SelectItem>
                      <SelectItem value="jazzcash">JazzCash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Account Details</Label>
                  <Textarea
                    placeholder={paymentMethod === 'bank_transfer' ? 'Bank name, account number, IBAN, branch code...' :
                      paymentMethod === 'paypal' ? 'PayPal email address...' :
                      paymentMethod === 'payoneer' ? 'Payoneer email or account ID...' :
                      paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash' ? 'Mobile number...' :
                      'Account details...'}
                    value={accountDetails}
                    onChange={(e) => setAccountDetails(e.target.value)}
                    rows={3}
                  />
                </div>
                {availableBalance <= 0 && (
                  <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-500/10 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    No funds available for withdrawal.
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setWithdrawOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleWithdraw}
                  disabled={submitting || availableBalance <= 0}
                  className="bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)] text-white"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="earnings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="earnings">Earnings History</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawal Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="earnings">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground">Loading...</div>
                ) : earnings.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground space-y-2">
                    <Wallet className="w-10 h-10 mx-auto opacity-30" />
                    <p>No earnings yet. Start receiving bookings to earn!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {earnings.map((e) => (
                      <div key={e.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">{e.description || e.source}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={statusColor(e.status)}>{e.status}</Badge>
                          <span className="text-sm font-bold text-emerald-400">+${Number(e.amount).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground">Loading...</div>
                ) : withdrawals.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground space-y-2">
                    <ArrowDownToLine className="w-10 h-10 mx-auto opacity-30" />
                    <p>No withdrawal requests yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {withdrawals.map((w) => (
                      <div key={w.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground capitalize">{w.payment_method.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {w.processed_at && ` · Processed ${new Date(w.processed_at).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={statusColor(w.status)}>{w.status}</Badge>
                          <span className="text-sm font-bold text-foreground">-${Number(w.amount).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Earnings;
