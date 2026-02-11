// DEPRECATED: This `backend/` entrypoint has been superseded by the canonical
// Express API service in the `api/` workspace. All new backend work should
// target `api/` and this file is kept only to avoid breaking existing imports.
//
// No server is started here to prevent architectural duplication and confusion
// about which API service is authoritative.

const deprecatedBackendStub = {};

export default deprecatedBackendStub;
