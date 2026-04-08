import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const advancedSecurity = require("./advancedSecurity.cjs");

export const authenticateWithRotation = advancedSecurity.authenticateWithRotation;
export const generateToken = advancedSecurity.generateToken;
export const verifyToken = advancedSecurity.verifyToken;

export default advancedSecurity;
