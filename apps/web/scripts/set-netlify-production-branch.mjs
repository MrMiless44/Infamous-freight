#!/usr/bin/env node
/* eslint-disable no-console */
/* global fetch */

const token = process.env.NETLIFY_AUTH_TOKEN;
const siteId = process.env.NETLIFY_SITE_ID;
const branch = process.env.NETLIFY_PRODUCTION_BRANCH || "main";

if (!token) {
  console.error("Missing NETLIFY_AUTH_TOKEN");
  process.exit(1);
}

if (!siteId) {
  console.error("Missing NETLIFY_SITE_ID");
  process.exit(1);
}

const apiBase = "https://api.netlify.com/api/v1";

async function run() {
  const res = await fetch(`${apiBase}/sites/${siteId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      build_settings: {
        repo_branch: branch,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Failed to update Netlify site branch (${res.status}): ${body}`);
    process.exit(1);
  }

  const site = await res.json();
  const current = site?.build_settings?.repo_branch;

  if (current !== branch) {
    console.error(
      `Netlify branch update response mismatch. Expected "${branch}", got "${current}"`,
    );
    process.exit(1);
  }

  console.log(`Netlify production branch set to "${current}" for site ${siteId}`);
}

run().catch((error) => {
  console.error("Unhandled error while updating Netlify site branch:", error);
  process.exit(1);
});
