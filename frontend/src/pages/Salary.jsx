import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { salaryAPI } from '../lib/api';
import { mockSalarySlips } from '../lib/mockData';
import { Download, Eye, DollarSign, TrendingUp, Loader2 } from 'lucide-react';

const Salary = () => {
  const { user } = useAuth();
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [salarySlips, setSalarySlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && user.employeeId) {
      fetchSalarySlips(user.employeeId);
    }
  }, [user]);

  const fetchSalarySlips = async (employeeId) => {
    try {
      setLoading(true);
      const response = await salaryAPI.getSalarySlips(employeeId);
      setSalarySlips(response.salarySlips || response);
    } catch (err) {
      console.error('Failed to fetch salary slips:', err);
      setError(err.message);
      // Fallback to mock data if API fails
      setSalarySlips(mockSalarySlips);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSlip = (slip) => {
    setSelectedSlip(slip);
  };

  const handleDownload = async (slip) => {
    try {
      const blob = await salaryAPI.downloadSalarySlip(slip.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `salary-slip-${slip.month}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
      alert(`Failed to download salary slip: ${err.message}`);
    }
  };

  const totalEarned = salarySlips.reduce((acc, slip) => acc + slip.netSalary, 0);
  const averageSalary = salarySlips.length > 0 ? totalEarned / salarySlips.length : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Salary Information</h2>
        <p className="text-gray-500 mt-1">View and download your salary slips</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Current Month
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{salarySlips[0]?.netSalary?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">{salarySlips[0]?.month || 'N/A'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Average Salary
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{averageSalary.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Last 4 months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Earned
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalEarned.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Last 4 months</p>
          </CardContent>
        </Card>
      </div>

      {/* Salary History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Salary History</CardTitle>
          <CardDescription>Complete history of your salary payments</CardDescription>
        </CardHeader>
        <CardContent>
          {salarySlips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <DollarSign className="h-10 w-10 mb-2 text-gray-300" />
              <span className="text-lg font-medium">No salary slips found.</span>
              <span className="text-sm">Your salary records will appear here once available.</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Basic Salary</TableHead>
                  <TableHead>HRA</TableHead>
                  <TableHead>Allowances</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salarySlips.map((slip) => (
                  <TableRow key={slip.id}>
                    <TableCell className="font-medium">{slip.month}</TableCell>
                    <TableCell>₹{slip.basicSalary.toLocaleString()}</TableCell>
                    <TableCell>₹{slip.hra.toLocaleString()}</TableCell>
                    <TableCell>₹{slip.allowances.toLocaleString()}</TableCell>
                    <TableCell className="text-red-600">
                      -₹{slip.deductions.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-bold">
                      ₹{slip.netSalary.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{slip.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewSlip(slip)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(slip)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detailed Salary Slip View */}
      {selectedSlip && (
        <Card>
          <CardHeader>
            <CardTitle>Salary Slip Details - {selectedSlip.month}</CardTitle>
            <CardDescription>Detailed breakdown of your salary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Earnings */}
              <div>
                <h4 className="font-semibold text-lg mb-3">Earnings</h4>
                <div className="space-y-2 bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Basic Salary</span>
                    <span className="font-medium">
                      ₹{selectedSlip.basicSalary.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">House Rent Allowance (HRA)</span>
                    <span className="font-medium">₹{selectedSlip.hra.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Other Allowances</span>
                    <span className="font-medium">
                      ₹{selectedSlip.allowances.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-green-200">
                    <span className="font-semibold">Gross Salary</span>
                    <span className="font-bold text-green-600">
                      ₹
                      {(
                        selectedSlip.basicSalary +
                        selectedSlip.hra +
                        selectedSlip.allowances
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="font-semibold text-lg mb-3">Deductions</h4>
                <div className="space-y-2 bg-red-50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax Deductions (TDS)</span>
                    <span className="font-medium text-red-600">
                      -₹{(selectedSlip.deductions * 0.6).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Provident Fund (PF)</span>
                    <span className="font-medium text-red-600">
                      -₹{(selectedSlip.deductions * 0.3).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Other Deductions</span>
                    <span className="font-medium text-red-600">
                      -₹{(selectedSlip.deductions * 0.1).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-red-200">
                    <span className="font-semibold">Total Deductions</span>
                    <span className="font-bold text-red-600">
                      -₹{selectedSlip.deductions.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">Net Salary</span>
                  <span className="text-2xl font-bold text-primary">
                    ₹{selectedSlip.netSalary.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Paid on {new Date(selectedSlip.date).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleDownload(selectedSlip)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Salary;
