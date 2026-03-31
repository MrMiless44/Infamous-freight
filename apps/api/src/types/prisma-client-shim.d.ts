declare module "@prisma/client" {
  export namespace Prisma {
    type UserCreateInput = any;
    type UserWhereUniqueInput = any;
    type UserSelect = any;
    type UserGetPayload<T> = any;
    type RefreshTokenCreateInput = any;
    type RefreshTokenUncheckedCreateInput = any;
    type RefreshTokenWhereUniqueInput = any;
    type RefreshTokenWhereInput = any;
  }

  export type BillingPlan = any;
  export const BillingPlan: any;
  export type JobEventType = any;
  export const JobEventType: any;
  export type JobStatus = any;
  export const JobStatus: any;
  export type UserRole = any;
  export const UserRole: any;

  export type RefreshToken = any;
  export type User = any;

  export class PrismaClient {
    [key: string]: any;
  }
}
