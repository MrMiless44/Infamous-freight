import type { RequestHandler } from "express";
import type { ValidationChain } from "express-validator";

export declare function validateString(
  field: string,
  opts?: { maxLength?: number },
): ValidationChain;
export declare function validateEmail(field?: string): ValidationChain;
export declare function validatePhone(field?: string): ValidationChain;
export declare function validateUUID(field?: string): ValidationChain;
export declare function validateUUIDBody(field: string): ValidationChain;
export declare function validateEnum(field: string, values: string[]): ValidationChain;
export declare function validateEnumQuery(field: string, values: string[]): ValidationChain;
export declare function validatePaginationQuery(): ValidationChain[];
export declare const handleValidationErrors: RequestHandler;

declare const validation: {
  validateString: typeof validateString;
  validateEmail: typeof validateEmail;
  validatePhone: typeof validatePhone;
  validateUUID: typeof validateUUID;
  validateUUIDBody: typeof validateUUIDBody;
  validateEnum: typeof validateEnum;
  validateEnumQuery: typeof validateEnumQuery;
  validatePaginationQuery: typeof validatePaginationQuery;
  handleValidationErrors: typeof handleValidationErrors;
};

export default validation;
