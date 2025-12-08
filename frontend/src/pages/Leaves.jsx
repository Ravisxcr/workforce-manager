import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { leaveAPI } from '../lib/api';
import { mockLeaves } from '../lib/mockData';
import { Calendar, Plus, X, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';

const Leaves = () => {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [leaveData, setLeaveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    type: 'Casual Leave',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      const balance = await leaveAPI.getAllLeaves();
      console.log('Fetched leave data:', balance);
      setLeaveData({
        data: balance.data,
        extra: balance.extra,
      });
    } catch (err) {
      console.error('Failed to fetch leave data:', err);
      setError(err.message);
      // Fallback to mock data
      setLeaveData(mockLeaves);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await leaveAPI.requestLeave({
        type: formData.type,
        start_date: formData.startDate,
        end_date: formData.endDate,
        reason: formData.reason,
      });
      
      alert('Leave request submitted successfully!');
      setShowRequestForm(false);
      setFormData({
        type: 'Casual Leave',
        startDate: '',
        endDate: '',
        reason: '',
      });
      
      // Refresh leave data
      await fetchLeaveData();
    } catch (err) {
      console.error('Failed to submit leave request:', err);
      alert(`Failed to submit leave request: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (leaveId) => {
    if (confirm('Are you sure you want to cancel this leave request?')) {
      try {
        await leaveAPI.cancelLeave(leaveId);
        alert('Leave request cancelled successfully!');
        // Refresh leave data
        await fetchLeaveData();
      } catch (err) {
        console.error('Failed to cancel leave:', err);
        alert(`Failed to cancel leave request: ${err.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

    const leaves_count = leaveData.extra || {};

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'secondary';
      case 'Pending':
        return 'outline';
      case 'Rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'Pending':
        return <Clock className="h-4 w-4" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Leave Management</h2>
          <p className="text-gray-500 mt-1">Manage your leaves and time off</p>
        </div>
        <Button onClick={() => setShowRequestForm(!showRequestForm)}>
          {showRequestForm ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Request Leave
            </>
          )}
        </Button>
      </div>

      {/* Leave Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Leaves
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold">{leaves_count.additionalProp1 ?? 0} days</div>
            <p className="text-xs text-gray-500 mt-1">Annual allocation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Remaining Leaves
            </CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {leaves_count.additionalProp2 ?? 0} days
              </div>
            <p className="text-xs text-gray-500 mt-1">Available to use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Used Leaves
            </CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {leaves_count.additionalProp3 ?? 0} days
              </div>
            <p className="text-xs text-gray-500 mt-1">Already utilized</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Requested Leaves
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {leaves_count.requested_leave ?? 0} days
              </div>
            <p className="text-xs text-gray-500 mt-1">Already utilized</p>
          </CardContent>
        </Card>
      </div>

      {/* Request Leave Form as Modal Dialog */}
      {showRequestForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowRequestForm(false)}
              aria-label="Close"
            >
              <span className="text-2xl">&times;</span>
            </button>
            <h2 className="text-lg font-semibold mb-2">Request New Leave</h2>
            <p className="text-gray-500 mb-4">Fill in the details to request time off</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Leave Type</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Earned Leave">Earned Leave</option>
                    <option value="Emergency Leave">Emergency Leave</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Number of Days</Label>
                  <Input
                    type="text"
                    value={
                      formData.startDate && formData.endDate
                        ? Math.ceil(
                            (new Date(formData.endDate) - new Date(formData.startDate)) /
                              (1000 * 60 * 60 * 24)
                          ) + 1
                        : 0
                    }
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a reason for your leave request..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRequestForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave History */}
      <Card>
        <CardHeader>
          <CardTitle>Leave History</CardTitle>
          <CardDescription>Your past and pending leave requests</CardDescription>
        </CardHeader>
        <CardContent>
          {(!leaveData.data || leaveData.data.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Calendar className="h-10 w-10 mb-2 text-gray-300" />
              <span className="text-lg font-medium">No leave records found.</span>
              <span className="text-sm">Your leave requests will appear here once available.</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Cancellation Requested</TableHead>
                  <TableHead>Cancellation Approved</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveData.data.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell className="font-medium">{leave.type}</TableCell>
                    <TableCell>{new Date(leave.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                    <TableCell>{new Date(leave.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                    <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                    <TableCell>{leave.days}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(leave.status)} className="flex items-center gap-1 w-fit">
                        {getStatusIcon(leave.status)}
                        {leave.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{leave.approved_by || '-'}</TableCell>
                    <TableCell>{leave.cancellation_requested ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{leave.cancellation_approved ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      {leave.status === 'pending' && !leave.cancellation_requested && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancel(leave.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Leave Policy Info */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Policy Information</CardTitle>
          <CardDescription>Important guidelines and policies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <p className="text-gray-600">
                Casual leaves can be taken for personal work and require prior approval.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <p className="text-gray-600">
                Sick leaves require medical certificate for leaves exceeding 3 days.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <p className="text-gray-600">
                Leave requests should be submitted at least 3 days in advance.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <p className="text-gray-600">
                Unused leaves can be carried forward to the next year (max 5 days).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaves;
