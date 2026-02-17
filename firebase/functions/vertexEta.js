const { PredictionServiceClient } = require('@google-cloud/aiplatform');

const client = new PredictionServiceClient();

const VERTEX_AI_PROJECT_ID = process.env.VERTEX_AI_PROJECT_ID;
const VERTEX_AI_ENDPOINT_ID = process.env.VERTEX_AI_ENDPOINT_ID;
const VERTEX_AI_LOCATION = process.env.VERTEX_AI_LOCATION || 'us-central1';

if (
  !VERTEX_AI_PROJECT_ID ||
  !VERTEX_AI_ENDPOINT_ID ||
  VERTEX_AI_PROJECT_ID === 'YOUR_PROJECT' ||
  VERTEX_AI_ENDPOINT_ID === 'YOUR_ENDPOINT_ID'
) {
  throw new Error(
    'Vertex AI configuration is invalid. Please set VERTEX_AI_PROJECT_ID, VERTEX_AI_ENDPOINT_ID, and optionally VERTEX_AI_LOCATION environment variables.',
  );
}

async function predictETA(shipmentFeatures) {
  const endpoint = `projects/${VERTEX_AI_PROJECT_ID}/locations/${VERTEX_AI_LOCATION}/endpoints/${VERTEX_AI_ENDPOINT_ID}`;

  const [response] = await client.predict({
    endpoint,
    instances: [shipmentFeatures],
  });

  return response.predictions[0];
}

module.exports = {
  predictETA,
};
