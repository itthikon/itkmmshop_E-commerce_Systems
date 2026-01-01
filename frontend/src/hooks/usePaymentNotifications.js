import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../config/api';

const POLLING_INTERVAL = 30000; // 30 seconds
const MAX_BACKOFF = 300000; // 5 minutes
const VIEWED_PAYMENTS_KEY = 'viewedPayments';

const usePaymentNotifications = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [newPayments, setNewPayments] = useState([]);
  const [isPolling, setIsPolling] = useState(true);
  
  const pollingIntervalRef = useRef(POLLING_INTERVAL);
  const timeoutRef = useRef(null);
  const consecutiveErrorsRef = useRef(0);

  // Get viewed payments from localStorage
  const getViewedPayments = useCallback(() => {
    try {
      const viewed = localStorage.getItem(VIEWED_PAYMENTS_KEY);
      return viewed ? JSON.parse(viewed) : [];
    } catch (error) {
      console.error('Error reading viewed payments:', error);
      return [];
    }
  }, []);

  // Save viewed payments to localStorage
  const saveViewedPayments = useCallback((paymentIds) => {
    try {
      localStorage.setItem(VIEWED_PAYMENTS_KEY, JSON.stringify(paymentIds));
    } catch (error) {
      console.error('Error saving viewed payments:', error);
    }
  }, []);

  // Mark payment as viewed
  const markAsViewed = useCallback((paymentId) => {
    const viewed = getViewedPayments();
    if (!viewed.includes(paymentId)) {
      const updated = [...viewed, paymentId];
      saveViewedPayments(updated);
      
      // Update newPayments state
      setNewPayments(prev => prev.filter(p => p.id !== paymentId));
    }
  }, [getViewedPayments, saveViewedPayments]);

  // Fetch pending payments
  const fetchPendingPayments = useCallback(async () => {
    try {
      const response = await api.get('/payments', {
        params: { status: 'pending' }
      });

      const payments = response.data.payments || [];
      setPendingCount(payments.length);

      // Filter out viewed payments
      const viewedIds = getViewedPayments();
      const unviewedPayments = payments.filter(p => !viewedIds.includes(p.id));
      setNewPayments(unviewedPayments);

      // Reset error count on success
      consecutiveErrorsRef.current = 0;
      pollingIntervalRef.current = POLLING_INTERVAL;

    } catch (error) {
      console.error('Error fetching pending payments:', error);
      
      // Implement exponential backoff
      consecutiveErrorsRef.current += 1;
      const backoffMultiplier = Math.pow(2, consecutiveErrorsRef.current - 1);
      pollingIntervalRef.current = Math.min(
        POLLING_INTERVAL * backoffMultiplier,
        MAX_BACKOFF
      );
    }
  }, [getViewedPayments]);

  // Refresh function to manually trigger fetch
  const refresh = useCallback(() => {
    fetchPendingPayments();
  }, [fetchPendingPayments]);

  // Setup polling
  useEffect(() => {
    if (!isPolling) return;

    // Initial fetch
    fetchPendingPayments();

    // Setup polling with current interval
    const poll = () => {
      fetchPendingPayments();
      timeoutRef.current = setTimeout(poll, pollingIntervalRef.current);
    };

    timeoutRef.current = setTimeout(poll, pollingIntervalRef.current);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPolling, fetchPendingPayments]);

  // Pause/resume polling (useful for when component is not visible)
  const pausePolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  const resumePolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  return {
    pendingCount,
    newPayments,
    markAsViewed,
    refresh,
    pausePolling,
    resumePolling
  };
};

export default usePaymentNotifications;
