/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Stripe Client Initialization
 */

const Stripe = require("stripe");

const key = process.env.STRIPE_SECRET_KEY;

const stripe = key
  ? new Stripe(key, {
      apiVersion: "2024-06-20",
    })
  : new Proxy(
      {},
      {
        get() {
          throw new Error("Stripe not configured");
        },
      },
    );

module.exports = { stripe, stripeConfigured: !!key };
