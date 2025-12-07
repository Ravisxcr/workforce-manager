// Mock data for salary slips
export const mockSalarySlips = [
  {
    id: '1',
    month: 'November 2025',
    basicSalary: 50000,
    hra: 20000,
    allowances: 10000,
    deductions: 5000,
    netSalary: 75000,
    date: '2025-11-30',
    status: 'Paid',
  },
  {
    id: '2',
    month: 'October 2025',
    basicSalary: 50000,
    hra: 20000,
    allowances: 10000,
    deductions: 5000,
    netSalary: 75000,
    date: '2025-10-31',
    status: 'Paid',
  },
  {
    id: '3',
    month: 'September 2025',
    basicSalary: 50000,
    hra: 20000,
    allowances: 10000,
    deductions: 5000,
    netSalary: 75000,
    date: '2025-09-30',
    status: 'Paid',
  },
  {
    id: '4',
    month: 'August 2025',
    basicSalary: 48000,
    hra: 19200,
    allowances: 9600,
    deductions: 4800,
    netSalary: 72000,
    date: '2025-08-31',
    status: 'Paid',
  },
];

// Mock data for leaves
export const mockLeaves = {
  totalLeaves: 24,
  usedLeaves: 8,
  remainingLeaves: 16,
  leaveHistory: [
    {
      id: '1',
      type: 'Sick Leave',
      startDate: '2025-11-15',
      endDate: '2025-11-17',
      days: 3,
      status: 'Approved',
      reason: 'Medical checkup',
    },
    {
      id: '2',
      type: 'Casual Leave',
      startDate: '2025-10-10',
      endDate: '2025-10-12',
      days: 3,
      status: 'Approved',
      reason: 'Personal work',
    },
    {
      id: '3',
      type: 'Casual Leave',
      startDate: '2025-09-05',
      endDate: '2025-09-06',
      days: 2,
      status: 'Approved',
      reason: 'Family function',
    },
    {
      id: '4',
      type: 'Sick Leave',
      startDate: '2025-12-20',
      endDate: '2025-12-20',
      days: 1,
      status: 'Pending',
      reason: 'Doctor appointment',
    },
  ],
};

// Mock verification data
export const mockVerificationStatus = {
  idVerified: false,
  documentsSubmitted: [],
  verificationStatus: 'Pending',
  requiredDocuments: [
    { id: '1', name: 'Aadhaar Card', required: true, uploaded: false },
    { id: '2', name: 'PAN Card', required: true, uploaded: false },
    { id: '3', name: 'Address Proof', required: true, uploaded: false },
    { id: '4', name: 'Educational Certificates', required: false, uploaded: false },
  ],
};
