/**
 * Mutation Testing Configuration for 110% Coverage
 * Uses Stryker Mutator to achieve mutation testing coverage
 * Ensures tests catch subtle bugs that traditional coverage misses
 */

module.exports = {
  mutate: [
    "src/**/*.js",
    "!src/**/*.test.js",
    "!src/**/*.spec.js",
    "!src/config.js",
    "!src/instrument.js",
  ],
  testRunner: "jest",
  reporters: ["progress", "clear-text", "html", "json", "dashboard"],
  coverageAnalysis: "perTest",
  jest: {
    projectType: "custom",
    configFile: "jest.config.js",
    enableFindRelatedTests: true,
  },
  thresholds: {
    high: 90,
    low: 75,
    break: 70,
  },
  mutator: {
    plugins: [
      "@stryker-mutator/javascript-mutator",
    ],
    excludedMutations: [
      "StringLiteral", // Exclude string literal mutations (less critical)
      "LogStatement",  // Don't mutate logging statements
    ],
  },
  timeoutMS: 60000,
  timeoutFactor: 2,
  maxConcurrentTestRunners: 4,
  concurrency: 4,
  tempDirName: "stryker-tmp",
  cleanTempDir: true,
  Dashboard: {
    project: "github.com/MrMiless44/Infamous-freight",
    version: "main",
    module: "apps/api",
    baseUrl: "https://dashboard.stryker-mutator.io",
  },
  htmlReporter: {
    baseDir: "coverage/mutation",
  },
  jsonReporter: {
    fileName: "coverage/mutation/mutation-report.json",
  },
  checkers: [
    "typescript",
  ],
  ignorePatterns: [
    "**/node_modules/**",
    "**/coverage/**",
    "**/dist/**",
    "**/__tests__/**",
    "**/prisma/**",
    "**/scripts/**",
  ],
  // Advanced mutation types for 110% coverage
  mutationTypes: [
    "ArithmeticOperator",     // + becomes -, * becomes /
    "ArrayDeclaration",       // [] becomes [1]
    "ArrowFunction",          // Arrow fn params/body mutations
    "BlockStatement",         // Block removal
    "BooleanLiteral",         // true becomes false
    "ConditionalExpression",  // Ternary mutations
    "EqualityOperator",       // === becomes !==
    "LogicalOperator",        // && becomes ||
    "MethodExpression",       // Method call mutations
    "ObjectLiteral",          // Object property mutations
    "OptionalChaining",       // ?. becomes .
    "StringLiteral",          // String mutations
    "UnaryOperator",          // ! becomes identity
    "UpdateOperator",         // ++ becomes --
    "RegexLiteral",          // Regex pattern mutations
  ],
  // Specific mutations to catch edge cases
  customMutations: {
    // Off-by-one errors
    boundaries: {
      "<": ["<=", "==", ">"],
      "<=": ["<", "==", ">="],
      ">": [">=", "==", "<"],
      ">=": [">", "==", "<="],
    },
    // Logical operator confusion
    logic: {
      "&&": ["||", ""],
      "||": ["&&", ""],
      "!": [""],
    },
    // Null/undefined handling
    nullish: {
      "null": ["undefined", "0", '""', "[]"],
      "undefined": ["null", "0", '""'],
      "??": ["||", "&&"],
    },
    // Async/await mutations
    async: {
      "await": [""],
      "async": [""],
      ".then": [".catch"],
      ".catch": [".then"],
    },
    // Array/object methods
    collections: {
      ".map": [".filter", ".forEach"],
      ".filter": [".map", ".find"],
      ".find": [".filter", ".some"],
      ".some": [".every", ".find"],
      ".every": [".some"],
      ".reduce": [".map"],
      ".push": [".pop", ".unshift"],
      ".shift": [".pop", ".unshift"],
    },
  },
};
