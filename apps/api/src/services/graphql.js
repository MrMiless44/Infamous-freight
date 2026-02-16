/**
 * GraphQL API Layer
 * Flexible query interface alongside REST API
 * Generates GraphQL schema from existing data models
 */

const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLEnumType,
  graphql,
} = require("graphql");
const { logger } = require("../middleware/logger");

/**
 * GraphQL Types - Define data structures
 */

const ShipmentStatus = new GraphQLEnumType({
  name: "ShipmentStatus",
  values: {
    CREATED: { value: "CREATED" },
    IN_TRANSIT: { value: "IN_TRANSIT" },
    DELIVERED: { value: "DELIVERED" },
    CANCELLED: { value: "CANCELLED" },
  },
});

const UserRole = new GraphQLEnumType({
  name: "UserRole",
  values: {
    ADMIN: { value: "ADMIN" },
    SHIPPER: { value: "SHIPPER" },
    DRIVER: { value: "DRIVER" },
  },
});

const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: GraphQLString },
    role: { type: UserRole },
    createdAt: { type: GraphQLString },
    shipments: {
      type: new GraphQLList(ShipmentType),
      resolve: async (user, args, context) => {
        return context.prisma.shipment.findMany({
          where: { userId: user.id },
        });
      },
    },
  }),
});

const DriverType = new GraphQLObjectType({
  name: "Driver",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    status: { type: GraphQLString },
    shipments: {
      type: new GraphQLList(ShipmentType),
      resolve: async (driver, args, context) => {
        return context.prisma.shipment.findMany({
          where: { driverId: driver.id },
        });
      },
    },
  }),
});

const ShipmentType = new GraphQLObjectType({
  name: "Shipment",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    reference: { type: new GraphQLNonNull(GraphQLString) },
    trackingId: { type: GraphQLString },
    status: { type: ShipmentStatus },
    origin: { type: GraphQLString },
    destination: { type: GraphQLString },
    shipper: {
      type: UserType,
      resolve: async (shipment, args, context) => {
        return context.prisma.user.findUnique({
          where: { id: shipment.userId },
        });
      },
    },
    driver: {
      type: DriverType,
      resolve: async (shipment, args, context) => {
        if (!shipment.driverId) return null;
        return context.prisma.driver.findUnique({
          where: { id: shipment.driverId },
        });
      },
    },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  }),
});

const PaymentType = new GraphQLObjectType({
  name: "Payment",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    user: {
      type: UserType,
      resolve: async (payment, args, context) => {
        return context.prisma.user.findUnique({
          where: { id: payment.userId },
        });
      },
    },
    amount: { type: GraphQLInt },
    currency: { type: GraphQLString },
    status: { type: GraphQLString },
    stripePaymentIntentId: { type: GraphQLString },
    createdAt: { type: GraphQLString },
  }),
});

/**
 * Root Query Type
 */
const QueryType = new GraphQLObjectType({
  name: "Query",
  fields: {
    user: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (root, args, context) => {
        return context.prisma.user.findUnique({
          where: { id: args.id },
        });
      },
    },
    shipments: {
      type: new GraphQLList(ShipmentType),
      args: {
        status: { type: ShipmentStatus },
        limit: { type: GraphQLInt, defaultValue: 20 },
        offset: { type: GraphQLInt, defaultValue: 0 },
      },
      resolve: async (root, args, context) => {
        const where = args.status ? { status: args.status } : {};
        return context.prisma.shipment.findMany({
          where,
          take: args.limit,
          skip: args.offset,
          orderBy: { createdAt: "desc" },
        });
      },
    },
    shipment: {
      type: ShipmentType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (root, args, context) => {
        return context.prisma.shipment.findUnique({
          where: { id: args.id },
        });
      },
    },
    drivers: {
      type: new GraphQLList(DriverType),
      resolve: async (root, args, context) => {
        return context.prisma.driver.findMany();
      },
    },
    payments: {
      type: new GraphQLList(PaymentType),
      args: {
        limit: { type: GraphQLInt, defaultValue: 20 },
        offset: { type: GraphQLInt, defaultValue: 0 },
      },
      resolve: async (root, args, context) => {
        return context.prisma.payment.findMany({
          take: args.limit,
          skip: args.offset,
          orderBy: { createdAt: "desc" },
        });
      },
    },
  },
});

/**
 * GraphQL Schema
 */
const schema = new GraphQLSchema({
  query: QueryType,
});

/**
 * Execute GraphQL query
 */
async function executeGraphQL(query, variables, context) {
  try {
    const result = await graphql({
      schema,
      source: query,
      variableValues: variables,
      contextValue: context,
    });

    if (result.errors) {
      logger.error("GraphQL query errors", {
        errors: result.errors.map((e) => e.message),
      });
    }

    return result;
  } catch (error) {
    logger.error("GraphQL execution failed", { error: error.message });
    throw error;
  }
}

/**
 * Express middleware for GraphQL endpoint
 */
function graphqlMiddleware(req, res, next) {
  req.executeGraphQL = executeGraphQL;
  next();
}

/**
 * GraphQL endpoint handler
 */
async function handleGraphQL(req, res, next) {
  try {
    const { query, variables } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query required" });
    }

    const result = await executeGraphQL(query, variables, {
      prisma: req.app.locals.prisma,
      user: req.user,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  schema,
  executeGraphQL,
  graphqlMiddleware,
  handleGraphQL,
  types: {
    UserType,
    DriverType,
    ShipmentType,
    PaymentType,
    UserRole,
    ShipmentStatus,
  },
};
