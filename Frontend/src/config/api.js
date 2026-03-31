/**
 * API Configuration
 * Centralized API endpoint configuration for all environments
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getStoredAuthToken = () => {
  const authToken = localStorage.getItem('authToken') || '';
  const wardenToken = localStorage.getItem('wardenToken') || '';

  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isWarden = storedUser?.isWarden === true || String(storedUser?.role || '').toLowerCase() === 'warden';

    if (isWarden) {
      return wardenToken || authToken;
    }

    return authToken || wardenToken;
  } catch {
    return authToken || wardenToken;
  }
};

const normalizeHeaders = (headers) => {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const plain = {};
    headers.forEach((value, key) => {
      plain[key] = value;
    });
    return plain;
  }
  return { ...headers };
};

export const getAuthHeaders = (headers = {}) => {
  const merged = normalizeHeaders(headers);
  const token = getStoredAuthToken();
  if (token && !merged.Authorization) {
    merged.Authorization = `Bearer ${token}`;
  }
  return merged;
};

export const apiFetch = (url, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  const isFormData = options.body instanceof FormData;
  const baseHeaders = normalizeHeaders(options.headers);
  if (!isFormData && !baseHeaders['Content-Type'] && !baseHeaders['content-type'] && method !== 'GET') {
    baseHeaders['Content-Type'] = 'application/json';
  }

  return fetch(url, {
    ...options,
    headers: getAuthHeaders(baseHeaders)
  });
};

// Keep legacy direct axios calls authenticated in admin views.
if (!globalThis.__staySmartAxiosAuthInterceptorAttached) {
  axios.interceptors.request.use((config) => {
    const token = getStoredAuthToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  globalThis.__staySmartAxiosAuthInterceptorAttached = true;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const API_ENDPOINTS = {
  // Auth Endpoints
  LOGIN: `${API_BASE_URL}/api/v1/auth/login`,
  SIGNUP: `${API_BASE_URL}/api/v1/auth/signup`,
  WARDEN_LOGIN: `${API_BASE_URL}/api/v1/warden/login`,

  // Student Application Endpoints
  SUBMIT_APPLICATION: `${API_BASE_URL}/api/v1/applications/submit`,
  ACCEPT_ROOMMATE: `${API_BASE_URL}/api/v1/applications/accept-roommate`,
  DECLINE_ROOMMATE: `${API_BASE_URL}/api/v1/applications/decline-roommate`,
  CANCEL_ROOMMATE: `${API_BASE_URL}/api/v1/applications/cancel-roommate`,
  WITHDRAW_APPLICATION: `${API_BASE_URL}/api/v1/applications/withdraw`,
  GET_DASHBOARD: (studentId) => `${API_BASE_URL}/api/v1/applications/dashboard/${studentId}`,

  // Hostel Services
  MESS_OFF: `${API_BASE_URL}/api/v1/hostel/messoff`,
  MESS_CURRENT_BILL: `${API_BASE_URL}/api/v1/mess/current-bill`,
  MESS_SUBMIT_UTR: `${API_BASE_URL}/api/v1/mess/submit-utr`,
  HOSTEL_LEAVING: `${API_BASE_URL}/api/v1/hostel/hostelLeaving`,
  LOST_N_FOUND: `${API_BASE_URL}/api/v1/hostel/lostnfound`,
  COMPLAINT: `${API_BASE_URL}/api/v1/hostel/complaint`,
  HOSTEL_ALLOTMENT_LEGACY: `${API_BASE_URL}/api/v1/hostel/hostelAllotment`,

  // Feedback Endpoints
  HOSTEL_FEEDBACK: `${API_BASE_URL}/api/v1/feedback/hostel`,
  MESS_FEEDBACK: `${API_BASE_URL}/api/v1/feedback/mess`,

  // Notice Board Endpoints
  NOTICES_PUBLIC: `${API_BASE_URL}/api/v1/notices/public`,

  // Admin Endpoints
  ALLOCATE_FY: `${API_BASE_URL}/api/v1/admin/allocate-fy`,
  ALLOCATE_SENIORS: `${API_BASE_URL}/api/v1/admin/allocate-seniors`,
  GET_MASTER_LIST: `${API_BASE_URL}/api/v1/admin/master-list`,
  GET_APPLICATIONS: `${API_BASE_URL}/api/v1/admin/applications`,
  RESET_YEAR: `${API_BASE_URL}/api/v1/admin/reset-year`,
  TOGGLE_ALLOTMENT: (id) => `${API_BASE_URL}/api/v1/admin/toggle-allotment/${id}`,
  SEED_ROOMS: `${API_BASE_URL}/api/v1/admin/seed-rooms`,
  SEED_APPLICATIONS: `${API_BASE_URL}/api/v1/admin/seed-applications`,
  ADMIN_SEED_STUDENT_USERS: `${API_BASE_URL}/api/v1/admin/seed-student-users`,
  ADMIN_STATS: `${API_BASE_URL}/api/v1/admin/stats`,
  ADMIN_COMPLAINT: `${API_BASE_URL}/api/v1/admin/Complaint`,
  ADMIN_HOSTEL_FEEDBACK: `${API_BASE_URL}/api/v1/admin/hostelfeedback`,  
  ADMIN_MESS_FEEDBACK: `${API_BASE_URL}/api/v1/admin/messfeedback`,
  ADMIN_MESS_OFF: `${API_BASE_URL}/api/v1/admin/messoff`,
  ADMIN_MESSOFF_PENDING: `${API_BASE_URL}/api/v1/admin/messoff/pending`,
  ADMIN_MESSOFF_APPROVE: (requestId) => `${API_BASE_URL}/api/v1/admin/messoff/${requestId}/approve`,
  ADMIN_MESSOFF_REJECT: (requestId) => `${API_BASE_URL}/api/v1/admin/messoff/${requestId}/reject`,
  ADMIN_MESS_BILLS_PREVIEW: `${API_BASE_URL}/api/v1/admin/mess-bills/preview`,
  ADMIN_MESS_BILLS_GENERATE: `${API_BASE_URL}/api/v1/admin/mess-bills/generate`,
  ADMIN_MESS_BILLS_VERIFICATION: `${API_BASE_URL}/api/v1/admin/mess-bills/verification`,
  ADMIN_MESS_BILLS_APPROVE: (billId) => `${API_BASE_URL}/api/v1/admin/mess-bills/${billId}/approve`,
  ADMIN_MESS_BILLS_REJECT: (billId) => `${API_BASE_URL}/api/v1/admin/mess-bills/${billId}/reject`,
  
  // Individual Student Management
  MANUAL_ALLOT: `${API_BASE_URL}/api/v1/admin/manual-allot`,
  CANCEL_ALLOTMENT: `${API_BASE_URL}/api/v1/admin/cancel-allotment`,
  GET_AVAILABLE_ROOMS: `${API_BASE_URL}/api/v1/admin/available-rooms`,

  // Room Swap Endpoints (Student)
  SWAP_REQUEST: `${API_BASE_URL}/api/v1/swap/request`,
  SWAP_MY_REQUESTS: (studentId) => `${API_BASE_URL}/api/v1/swap/my-requests/${studentId}`,
  SWAP_RESPOND: (requestId) => `${API_BASE_URL}/api/v1/swap/respond/${requestId}`,
  SWAP_CANCEL: (requestId) => `${API_BASE_URL}/api/v1/swap/cancel/${requestId}`,
  SWAP_ELIGIBLE_TARGETS: (studentId) => `${API_BASE_URL}/api/v1/swap/eligible-targets/${studentId}`,

  // Room Swap Endpoints (Admin)
  ADMIN_SWAP_REQUESTS: `${API_BASE_URL}/api/v1/admin/swap-requests`,
  ADMIN_SWAP_DECISION: (requestId) => `${API_BASE_URL}/api/v1/admin/swap-decision/${requestId}`,

  // Maintenance Request Endpoints (Student)
  MAINTENANCE_CREATE: `${API_BASE_URL}/api/v1/maintenance/create`,
  MAINTENANCE_MY_REQUESTS: (studentId) => `${API_BASE_URL}/api/v1/maintenance/my/${studentId}`,
  MAINTENANCE_CLOSE: (requestId) => `${API_BASE_URL}/api/v1/maintenance/close/${requestId}`,

  // Maintenance Request Endpoints (Admin)
  ADMIN_MAINTENANCE_REQUESTS: `${API_BASE_URL}/api/v1/admin/maintenance-requests`,
  ADMIN_MAINTENANCE_UPDATE: (requestId) => `${API_BASE_URL}/api/v1/admin/maintenance/${requestId}`,
  ADMIN_MAINTENANCE_STATS: `${API_BASE_URL}/api/v1/admin/maintenance-stats`,

  // Night Out Pass Endpoints (Student)
  NIGHTOUT_CREATE: `${API_BASE_URL}/api/v1/nightout/create`,
  NIGHTOUT_MY_PASSES: (studentId) => `${API_BASE_URL}/api/v1/nightout/my/${studentId}`,
  NIGHTOUT_CANCEL: (passId) => `${API_BASE_URL}/api/v1/nightout/cancel/${passId}`,

  // Night Out Pass Endpoints (Admin)
  ADMIN_NIGHTOUT_PASSES: `${API_BASE_URL}/api/v1/admin/nightout-passes`,
  ADMIN_NIGHTOUT_PROCESS: (passId) => `${API_BASE_URL}/api/v1/admin/nightout/${passId}/process`,
  ADMIN_NIGHTOUT_CHECKOUT: (passId) => `${API_BASE_URL}/api/v1/admin/nightout/${passId}/checkout`,
  ADMIN_NIGHTOUT_CHECKIN: (passId) => `${API_BASE_URL}/api/v1/admin/nightout/${passId}/checkin`,
  ADMIN_NIGHTOUT_MARK_OVERDUE: `${API_BASE_URL}/api/v1/admin/nightout/mark-overdue`,
  ADMIN_NIGHTOUT_STATS: `${API_BASE_URL}/api/v1/admin/nightout-stats`,

  // Night Out Pass Endpoints (Warden Staff)
  WARDEN_NIGHTOUT_PASSES: `${API_BASE_URL}/api/v1/nightout/staff/passes`,
  WARDEN_NIGHTOUT_STATS: `${API_BASE_URL}/api/v1/nightout/staff/stats`,
  WARDEN_NIGHTOUT_PROCESS: (passId) => `${API_BASE_URL}/api/v1/nightout/staff/${passId}/process`,
  WARDEN_NIGHTOUT_CHECKOUT: (passId) => `${API_BASE_URL}/api/v1/nightout/staff/${passId}/checkout`,
  WARDEN_NIGHTOUT_CHECKIN: (passId) => `${API_BASE_URL}/api/v1/nightout/staff/${passId}/checkin`,

  // Dues & Payment Endpoints (Student)
  DUES_MY: (studentId) => `${API_BASE_URL}/api/v1/dues/my/${studentId}`,
  DUES_HISTORY: (dueId) => `${API_BASE_URL}/api/v1/dues/history/${dueId}`,
  DUES_PAY: (dueId) => `${API_BASE_URL}/api/v1/dues/pay/${dueId}`,

  // Dues & Payment Endpoints (Admin)
  ADMIN_DUES: `${API_BASE_URL}/api/v1/admin/dues`,
  ADMIN_DUES_STATS: `${API_BASE_URL}/api/v1/admin/dues-stats`,
  ADMIN_DUES_CREATE: `${API_BASE_URL}/api/v1/admin/dues/create`,
  ADMIN_DUES_BULK_CREATE: `${API_BASE_URL}/api/v1/admin/dues/bulk-create`,
  ADMIN_DUES_PAYMENT: (dueId) => `${API_BASE_URL}/api/v1/admin/dues/${dueId}/payment`,
  ADMIN_DUES_LATE_FEE: (dueId) => `${API_BASE_URL}/api/v1/admin/dues/${dueId}/late-fee`,
  ADMIN_DUES_WAIVE: (dueId) => `${API_BASE_URL}/api/v1/admin/dues/${dueId}/waive`,
  ADMIN_DUES_REMINDER: (dueId) => `${API_BASE_URL}/api/v1/admin/dues/${dueId}/reminder`,
  ADMIN_DUES_MARK_OVERDUE: `${API_BASE_URL}/api/v1/admin/dues/mark-overdue`,
  ADMIN_DUES_DELETE: (dueId) => `${API_BASE_URL}/api/v1/admin/dues/${dueId}`,

  // Smart Attendance System (Warden/Public)
  ATTENDANCE_BLOCKS: `${API_BASE_URL}/api/v1/attendance/blocks`,
  ATTENDANCE_ROOMS: (block) => `${API_BASE_URL}/api/v1/attendance/rooms/${block}`,
  ATTENDANCE_SUBMIT: `${API_BASE_URL}/api/v1/attendance/submit`,
  ATTENDANCE_STUDENT: (studentId) => `${API_BASE_URL}/api/v1/attendance/student/${studentId}`,

  // Smart Attendance System (Admin)
  ADMIN_ATTENDANCE_STATS: `${API_BASE_URL}/api/v1/admin/attendance/stats`,
  ADMIN_ATTENDANCE_REPORT: (date) => `${API_BASE_URL}/api/v1/admin/attendance/report/${date}`,
  ADMIN_ATTENDANCE_REPORT_TODAY: `${API_BASE_URL}/api/v1/admin/attendance/report`,
  ADMIN_ATTENDANCE_CHRONIC: `${API_BASE_URL}/api/v1/admin/attendance/chronic-absentees`,
  ADMIN_ATTENDANCE_DISPATCH: `${API_BASE_URL}/api/v1/admin/attendance/dispatch-alerts`,
  ADMIN_ATTENDANCE_DELETE: (id) => `${API_BASE_URL}/api/v1/admin/attendance/${id}`,

  // Admin Notice Board Management
  ADMIN_NOTICES: `${API_BASE_URL}/api/v1/admin/notices`,
  ADMIN_NOTICE_BY_ID: (noticeId) => `${API_BASE_URL}/api/v1/admin/notices/${noticeId}`,
  ADMIN_NOTICE_CONFIG: `${API_BASE_URL}/api/v1/admin/notices/config`,
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  apiFetch,
  apiClient,
  getAuthHeaders
};
