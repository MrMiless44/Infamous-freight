/**
 * Complete Integration Example Page
 * Shows how to use API client, hooks, and UI components together
 */

"use client";

import React, { useState } from "react";
import { useAuth, usePayment, useAIGeneration, useShipmentOptimization } from "@/hooks/useApi.implementation";

/**
 * Dashboard Component
 * Real example of how to integrate all features
 */
export default function DashboardPage() {
  const { user, loading: authLoading, login, logout } = useAuth();
  const { createPaymentIntent, loading: paymentLoading } = usePayment();
  const { suggestions, optimize, loading: optimizationLoading } = useShipmentOptimization();
  const { text, generate, loading: aiLoading } = useAIGeneration();
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [promptInput, setPromptInput] = useState("");
  const [shipmentId, setShipmentId] = useState("");

  /**
   * Handle Login Form
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginEmail, loginPassword);
      setLoginEmail("");
      setLoginPassword("");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  /**
   * Handle AI Generation
   */
  const handleGenerateText = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await generate(promptInput, 500, 0.7);
    } catch (error) {
      console.error("Generation failed:", error);
    }
  };

  /**
   * Handle Shipment Optimization
   */
  const handleOptimizeShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await optimize(shipmentId);
    } catch (error) {
      console.error("Optimization failed:", error);
    }
  };

  /**
   * Handle Payment
   */
  const handleCreatePayment = async () => {
    try {
      const intent = await createPaymentIntent(
        99.99,
        "Premium subscription",
      );
      console.log("Payment intent created:", intent);
      // TODO: Pass clientSecret to Stripe Elements
    } catch (error) {
      console.error("Payment failed:", error);
    }
  };

  // ==================== RENDER ====================

  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Welcome to Freight Enterprise
          </h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              {authLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Welcome, {user?.name}!
              </h1>
              <p className="text-gray-600 mt-2">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* AI Text Generation */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              🤖 AI Text Generation
            </h2>

            <form onSubmit={handleGenerateText} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your prompt
                </label>
                <textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="e.g., 'Generate a summary for a shipment from NY to LA...'"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={4}
                />
              </div>

              <button
                type="submit"
                disabled={aiLoading || !promptInput}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {aiLoading ? "Generating..." : "Generate"}
              </button>
            </form>

            {text && (
              <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="font-semibold text-indigo-900 mb-2">Result:</h3>
                <p className="text-indigo-800">{text}</p>
              </div>
            )}
          </div>

          {/* Shipment Optimization */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              📦 Optimize Shipment
            </h2>

            <form
              onSubmit={handleOptimizeShipment}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipment ID
                </label>
                <input
                  type="text"
                  value={shipmentId}
                  onChange={(e) => setShipmentId(e.target.value)}
                  placeholder="e.g., SHIP-123456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <button
                type="submit"
                disabled={optimizationLoading || !shipmentId}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {optimizationLoading ? "Optimizing..." : "Get Suggestions"}
              </button>
            </form>

            {suggestions.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="font-semibold text-gray-900">Suggestions:</h3>
                <ul className="space-y-2">
                  {suggestions.map((suggestion, i) => (
                    <li
                      key={i}
                      className="flex items-start space-x-2 text-gray-700"
                    >
                      <span className="text-green-600 font-bold">✓</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Billing */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              💳 Billing
            </h2>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Premium Access</p>
                <p className="text-3xl font-bold text-gray-900">$99.99</p>
                <p className="text-sm text-gray-600 mt-1">per month</p>
              </div>

              <button
                onClick={handleCreatePayment}
                disabled={paymentLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {paymentLoading ? "Processing..." : "Upgrade Now"}
              </button>

              <p className="text-xs text-gray-500 text-center">
                14 days free trial. Cancel anytime.
              </p>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              👤 Profile
            </h2>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="text-lg font-semibold text-gray-900">
                  {user?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-semibold text-gray-900">
                  {user?.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Guide */}
        <div className="mt-12 bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg">
          <h3 className="text-lg font-bold text-blue-900 mb-3">
            💡 Integration Guide
          </h3>
          <pre className="bg-blue-900 text-blue-50 p-4 rounded overflow-auto text-sm">
{`// Import hooks
import { useAuth, usePayment, useAIGeneration } from "@/hooks/useApi.implementation";

// Use in component
export default function MyComponent() {
  const { user, login, logout } = useAuth();
  const { createPaymentIntent } = usePayment();
  const { generate, text } = useAIGeneration();

  // Handle login
  const handleLogin = async () => {
    await login("user@example.com", "password");
  };

  // Generate AI text
  const handleGenerate = async () => {
    await generate("Your prompt here");
  };

  // Create payment
  const handlePayment = async () => {
    const intent = await createPaymentIntent(99.99, "Description");
  };

  return (
    <div>
      {!user ? (
        <button onClick={handleLogin}>Login</button>
      ) : (
        <>
          <p>Welcome {user.name}</p>
          <button onClick={handleGenerate}>Generate</button>
          <button onClick={handlePayment}>Pay</button>
        </>
      )}
    </div>
  );
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
