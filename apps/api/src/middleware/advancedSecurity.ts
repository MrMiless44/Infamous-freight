import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const advancedSecurity = require("./advancedSecurity.js");

export const authenticateWithRotation = advancedSecurity.authenticateWithRotation;
export const generateToken = advancedSecurity.generateToken;
export const verifyToken = advancedSecurity.verifyToken;

export default advancedSecurity;
