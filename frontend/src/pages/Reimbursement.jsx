import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { reimbursementAPI } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';
import { Label } from '../components/ui/label';

const Reimbursement = () => {
  const { user } = useAuth();

  const [form, setForm] = useState({
    amount: '',
    type: '',
    date: '',
    description: '',
    receipt: null,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [reimbursements, setReimbursements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Summary values
  const totalClaimed = reimbursements.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  const totalApproved = reimbursements.filter(r => r.status === 'Approved').reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  const totalPending = reimbursements.filter(r => r.status !== 'Approved').reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

  useEffect(() => {
    const fetchReimbursements = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await reimbursementAPI.getReimbursements(user.id);
        setReimbursements(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('Failed to load reimbursements');
      } finally {
        setLoading(false);
      }
    };
    fetchReimbursements();
  }, [user]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);
    try {
      await reimbursementAPI.createReimbursement({
        amount: form.amount,
        description: form.description,
        date_requested: form.date,
        receipt: form.receipt,
      });
      setSuccess(true);
      setForm({ amount: '', type: '', date: '', description: '', receipt: null });
      setFormOpen(false);
      // Refresh reimbursement list
      if (user) {
        const data = await reimbursementAPI.getReimbursements(user.id);
        setReimbursements(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit reimbursement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Reimbursement</h2>
          <p className="text-gray-500 mt-1">View and claim your reimbursements</p>
        </div>
        <Button className="mt-2 sm:mt-0 flex items-center gap-2" onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4" />
          Claim Reimbursement
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Claimed</CardTitle>
            <Badge className="bg-blue-100 text-blue-700">₹{totalClaimed}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalClaimed}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Approved</CardTitle>
            <Badge className="bg-green-100 text-green-700">₹{totalApproved}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalApproved}</div>
            <p className="text-xs text-gray-500 mt-1">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Pending</CardTitle>
            <Badge className="bg-yellow-100 text-yellow-700">₹{totalPending}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalPending}</div>
            <p className="text-xs text-gray-500 mt-1">Pending</p>
          </CardContent>
        </Card>
      </div>



      {/* Modal for Reimbursement Form */}
      {formOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setFormOpen(false)}
              aria-label="Close"
            >
              <span className="text-2xl">&times;</span>
            </button>
            <h2 className="text-lg font-semibold mb-2">Reimbursement Form</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  value={form.amount}
                  onChange={handleChange}
                  required
                  min={1}
                  placeholder="Enter amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  name="type"
                  type="text"
                  value={form.type}
                  onChange={handleChange}
                  required
                  placeholder="Travel, Food, Office Supplies, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  type="text"
                  value={form.description}
                  onChange={handleChange}
                  required
                  placeholder="Short description of the expense"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receipt">Receipt (optional)</Label>
                <Input
                  id="receipt"
                  name="receipt"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleChange}
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
              {success && <p className="text-green-600 mt-2">Reimbursement request submitted!</p>}
              {error && <p className="text-red-600 mt-2">{error}</p>}
            </form>
          </div>
        </div>
      )}

      {/* Reimbursement History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reimbursement History</CardTitle>
          <CardDescription>Complete history of your reimbursement requests</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center min-h-[200px] text-gray-500">Loading...</div>
          ) : reimbursements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <span className="text-lg font-medium">No reimbursement requests found.</span>
              <span className="text-sm">Your reimbursement records will appear here once available.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 border">Date</th>
                    <th className="px-3 py-2 border">Type</th>
                    <th className="px-3 py-2 border">Amount</th>
                    <th className="px-3 py-2 border">Description</th>
                    <th className="px-3 py-2 border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reimbursements.map((r) => (
                    <tr key={r.id}>
                      <td className="px-3 py-2 border">{r.date}</td>
                      <td className="px-3 py-2 border">{r.type}</td>
                      <td className="px-3 py-2 border">₹{r.amount}</td>
                      <td className="px-3 py-2 border">{r.description}</td>
                      <td className="px-3 py-2 border">
                        <Badge variant={r.status === 'Approved' ? 'success' : r.status === 'Rejected' ? 'destructive' : 'secondary'}>
                          {r.status || 'Pending'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default Reimbursement;
