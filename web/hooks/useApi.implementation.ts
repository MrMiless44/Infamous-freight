/**
 * React Hooks for API Integration
 * Custom hooks for authentication, billing, and AI features
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import apiClient from "@/lib/api-client.implementation";

// ============================================================================
// AUTH HOOKS
// ============================================================================

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (apiClient.isAuthenticated()) {
          const currentUser = await apiClient.getCurrentUser();
          setUser(currentUser);
        }
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch user");
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true);
        const result = await apiClient.login({ email, password });
        setUser(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        setLoading(true);
        const result = await apiClient.register({ email, password, name });
        setUser(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Registration failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Logout failed";
      setError(message);
      throw err;
    }
  }, []);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: apiClient.isAuthenticated(),
  };
}

// ============================================================================
// BILLING HOOKS
// ============================================================================

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

  const createPaymentIntent = useCallback(
    async (amount: number, description: string) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiClient.createPaymentIntent({
          amount,
          description,
        });
        setClientSecret(result.clientSecret);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Payment intent creation failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    loading,
    error,
    clientSecret,
    createPaymentIntent,
  };
}

export function useSubscription() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiClient.getSubscription();
      setSubscription(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch subscription";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSubscription = useCallback(
    async (priceId: string, trialDays?: number) => {
      try {
        setLoading(true);
        const result = await apiClient.createSubscription({
          priceId,
          trialDays,
        });
        setSubscription(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create subscription";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const cancelSubscription = useCallback(
    async (subscriptionId: string) => {
      try {
        setLoading(true);
        const result = await apiClient.cancelSubscription(subscriptionId);
        setSubscription(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to cancel subscription";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    subscription,
    loading,
    error,
    getSubscription,
    createSubscription,
    cancelSubscription,
  };
}

export function useInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getInvoices = useCallback(async (limit?: number) => {
    try {
      setLoading(true);
      const result = await apiClient.getInvoices(limit);
      setInvoices(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch invoices";
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    invoices,
    loading,
    error,
    getInvoices,
  };
}

// ============================================================================
// AI HOOKS
// ============================================================================

export function useAIGeneration() {
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(0);

  const generate = useCallback(
    async (prompt: string, maxTokens?: number, temperature?: number) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiClient.generateText({
          prompt,
          maxTokens,
          temperature,
        });
        setText(result.text);
        setDuration(result.duration);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Generation failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const clear = useCallback(() => {
    setText(null);
    setError(null);
    setDuration(0);
  }, []);

  return {
    text,
    loading,
    error,
    duration,
    generate,
    clear,
  };
}

export function useShipmentOptimization() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const optimize = useCallback(async (shipmentId: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.getShipmentOptimization(shipmentId);
      setSuggestions(result.suggestions);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Optimization failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    suggestions,
    loading,
    error,
    optimize,
  };
}

export function useSentimentAnalysis() {
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = useCallback(async (text: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.analyzeSentiment(text);
      setSentiment(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sentiment,
    loading,
    error,
    analyze,
  };
}

export function useVoiceCommand() {
  const [command, setCommand] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const processCommand = useCallback(async (transcription: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.processVoiceCommand(transcription);
      setCommand(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Command processing failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstart = () => {
        setIsListening(true);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Microphone access denied";
      setError(message);
    }
  }, []);

  const stopListening = useCallback(async () => {
    if (!mediaRecorderRef.current) return;

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        // Send to voice service for transcription
        // TODO: Implement voice transcription
        const transcription = "[Audio transcription would go here]";

        await processCommand(transcription);
        setIsListening(false);
        resolve(true);
      };

      mediaRecorder.stop();
    });
  }, [processCommand]);

  return {
    command,
    loading,
    error,
    isListening,
    processCommand,
    startListening,
    stopListening,
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

export function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  dependencies: unknown[] = [],
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const result = await fetchFn();
        setData(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch data";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, dependencies);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  return { data, loading, error, refetch };
}
