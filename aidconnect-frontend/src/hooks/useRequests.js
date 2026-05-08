import { useState, useCallback, useRef } from 'react';
import {
  createRequest,
  getMyRequests,
  getNearbyRequests,
  getRequestById,
  cancelRequest,
  acceptRequest,
  updateRequestStatus,
  rateRequest,
  getAllRequests,
  deleteRequest,
} from '../api/request.api.js';
import { REQUEST_STATUSES, EMERGENCY_TYPES, URGENCY_LEVELS } from '../utils/constants.js';

export const DEFAULT_FILTERS = {
  status:        '',
  emergencyType: '',
  urgencyLevel:  '',
  page:          1,
  limit:         10,
};

const useRequests = () => {
  const [requests,       setRequests]       = useState([]);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [pagination,     setPagination]     = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading,        setLoading]        = useState(false);
  const [actionLoading,  setActionLoading]  = useState(false);
  const [error,          setError]          = useState(null);
  const [filters,        setFilters]        = useState(DEFAULT_FILTERS);

  const mountedRef = useRef(true);
  const safeSet = (setter) => (val) => { if (mountedRef.current) setter(val); };

  const handleError = useCallback((err) => {
    const message = err.response?.data?.message || err.message || 'Something went wrong';
    safeSet(setError)(message);
  }, []);
  const normalisePagination = (data) => ({
    page:       data?.pagination?.page   ?? 1,
    limit:      data?.pagination?.limit  ?? 10,
    total:      data?.pagination?.total  ?? 0,
    totalPages: data?.pagination?.pages  ?? 1,
  });

  const resetFilters   = useCallback(() => setFilters(DEFAULT_FILTERS), []);
  const clearError     = useCallback(() => setError(null), []);
  const clearCurrentRequest = useCallback(() => setCurrentRequest(null), []);
  const fetchMyRequests = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyRequests(params);
      safeSet(setRequests)(data.data ?? []);           // ← fixed
      safeSet(setPagination)(normalisePagination(data));
      return data;
    } catch (err) {
      handleError(err);
    } finally {
      safeSet(setLoading)(false);
    }
  }, [handleError]);
  const submitRequest = useCallback(async (requestData) => {
    setActionLoading(true);
    setError(null);
    try {
      const data = await createRequest(requestData);
      safeSet(setRequests)((prev) => [data.data, ...prev]);
      return data.data;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      safeSet(setActionLoading)(false);
    }
  }, [handleError]);
  const cancelMyRequest = useCallback(async (requestId) => {
    setActionLoading(true);
    setError(null);
    try {
      const data = await cancelRequest(requestId);
      safeSet(setRequests)((prev) =>
        prev.map((r) => r._id === requestId ? { ...r, status: 'cancelled' } : r)
      );
      safeSet(setCurrentRequest)((prev) =>
        prev?._id === requestId ? { ...prev, status: 'cancelled' } : prev
      );
      return data;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      safeSet(setActionLoading)(false);
    }
  }, [handleError]);
  const submitRating = useCallback(async (requestId, ratingData) => {
    setActionLoading(true);
    setError(null);
    try {
      const data = await rateRequest(requestId, ratingData);
      return data;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      safeSet(setActionLoading)(false);
    }
  }, [handleError]);
  const fetchRequestById = useCallback(async (requestId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRequestById(requestId);
      safeSet(setCurrentRequest)(data.data ?? data);   // ← fixed
      return data.data ?? data;
    } catch (err) {
      handleError(err);
    } finally {
      safeSet(setLoading)(false);
    }
  }, [handleError]);
  const fetchNearbyRequests = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNearbyRequests(params);
      safeSet(setRequests)(data.data ?? []);           // ← fixed
      safeSet(setPagination)(normalisePagination(data));
      return data;
    } catch (err) {
      handleError(err);
    } finally {
      safeSet(setLoading)(false);
    }
  }, [handleError]);
  const acceptNearbyRequest = useCallback(async (requestId, matchId) => {
    setActionLoading(true);
    setError(null);
    try {
      const data = await acceptRequest(requestId, matchId);
      safeSet(setRequests)((prev) => prev.filter((r) => r._id !== requestId));
      return data;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      safeSet(setActionLoading)(false);
    }
  }, [handleError]);
  const changeRequestStatus = useCallback(async (requestId, status) => {
    setActionLoading(true);
    setError(null);
    try {
      const data = await updateRequestStatus(requestId, status);
      safeSet(setRequests)((prev) =>
        prev.map((r) => r._id === requestId ? { ...r, status } : r)
      );
      safeSet(setCurrentRequest)((prev) =>
        prev?._id === requestId ? { ...prev, status } : prev
      );
      return data;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      safeSet(setActionLoading)(false);
    }
  }, [handleError]);
  const fetchAllRequests = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllRequests(params);
      safeSet(setRequests)(data.data ?? []);           // ← fixed
      safeSet(setPagination)(normalisePagination(data));
      return data;
    } catch (err) {
      handleError(err);
    } finally {
      safeSet(setLoading)(false);
    }
  }, [handleError]);
  const removeRequest = useCallback(async (requestId) => {
    setActionLoading(true);
    setError(null);
    try {
      const data = await deleteRequest(requestId);
      safeSet(setRequests)((prev) => prev.filter((r) => r._id !== requestId));
      return data;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      safeSet(setActionLoading)(false);
    }
  }, [handleError]);
  const getStatusMeta = useCallback((value) =>
    REQUEST_STATUSES.find((s) => s.value === value) ?? { value, label: value, color: 'stone' }
  , []);

  const getEmergencyMeta = useCallback((value) =>
    EMERGENCY_TYPES.find((e) => e.value === value) ?? { value, label: value, emoji: '🆘' }
  , []);

  const getUrgencyMeta = useCallback((value) =>
    URGENCY_LEVELS.find((u) => u.value === value) ?? { value, label: value, color: 'green' }
  , []);

  return {
    requests,
    currentRequest,
    pagination,
    loading,
    actionLoading,
    error,
    filters,
    setFilters,
    resetFilters,
    fetchMyRequests,
    submitRequest,
    cancelMyRequest,
    submitRating,
    fetchRequestById,
    fetchNearbyRequests,
    acceptNearbyRequest,
    changeRequestStatus,
    fetchAllRequests,
    removeRequest,
    getStatusMeta,
    getEmergencyMeta,
    getUrgencyMeta,
    clearError,
    clearCurrentRequest,
  };
};

export default useRequests;
