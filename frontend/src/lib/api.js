
// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Helper function for making API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('access_token');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };
  if (options.body instanceof FormData) {
    // Let the browser set the Content-Type including the boundary for multipart/form-data
    delete config.headers['Content-Type'];
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {

  login: async (email, password) => {
    // POST /auth/login { email, password }
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    // Expecting: { access_token: string, ... }
    if (response.access_token) {
      localStorage.setItem('access_token', response.access_token);
    }
    return response;
  },

  signup: async (name, email, password) => {
    // POST /auth/add-user { full_name, email, password }
    const response = await apiRequest('/auth/add-user', {
      method: 'POST',
      body: JSON.stringify({ full_name: name, email, password }),
    });
    // Expecting: { access_token: string, ... }
    if (response.access_token) {
      localStorage.setItem('access_token', response.access_token);
    }
    return response;
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: async () => {
    // GET /auth/user-info with Authorization: Bearer <access_token>
    return await apiRequest('/auth/user-info');
  },
};

// Salary API
export const salaryAPI = {
  getSalarySlips: async (employee_id) => {
    // GET /admin/salary-slip/{employee_id}
    return await apiRequest(`/admin/salary-slip/${employee_id}`);
  },

  getSalarySlipById: async (id) => {
    return await apiRequest(`/salary/slips/${id}`);
  },

  downloadSalarySlip: async (id) => {
  const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/salary/slips/${id}/download`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to download salary slip');
    }
    
    return await response.blob();
  },
};

// Leave API
export const leaveAPI = {

  getAllLeaves: async () => {
    // GET /leave/
    return await apiRequest('/leave/');
  },

  requestLeave: async (leaveData) => {
    // POST /leave/
    return await apiRequest('/leave/', {
      method: 'POST',
      body: JSON.stringify(leaveData),
    });
  },

  cancelLeave: async (leaveId) => {
    // PUT /leave/leave/cancel-request/{leave_id}
    return await apiRequest(`/leave/cancel-request/${leaveId}`, {
      method: 'PUT'
    });
  },
};

export const reimbursementAPI = {
  
  createReimbursement: async ({ amount, description, date, type, receipt }) => {
    // POST /reimbursement/ (multipart/form-data)
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('type', type);
    formData.append('description', description || '');
    formData.append('requested_date', date);
    if (receipt) {
      formData.append('receipt', receipt);
    }
    const response = await apiRequest('/reimbursement/', {
      method: 'POST',
      body: formData,
    });
    return await response;
  },

  getReimbursements: async () => {
    // GET /reimbursement/
    return await apiRequest('/reimbursement/');
  }

};

// Verification API
export const verificationAPI = {
  getVerificationStatus: async () => {
    return await apiRequest('/verification/status');
  },

  uploadDocument: async (documentType, file) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', documentType);

  const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/verification/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    return await response.json();
  },

  submitVerification: async () => {
    return await apiRequest('/verification/submit', {
      method: 'POST',
    });
  },

  getRequiredDocuments: async () => {
    return await apiRequest('/verification/required-documents');
  },
};

// Dashboard API
export const dashboardAPI = {
  getOverview: async () => {
    return await apiRequest('/dashboard/overview');
  },

  getRecentActivity: async () => {
    return await apiRequest('/dashboard/activity');
  },
};

export default {
  auth: authAPI,
  salary: salaryAPI,
  leave: leaveAPI,
  verification: verificationAPI,
  dashboard: dashboardAPI,
  reimbursement: reimbursementAPI,
};
