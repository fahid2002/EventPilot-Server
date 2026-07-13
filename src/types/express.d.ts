import type { Role, Membership } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        membership: Membership;
        isDemo: boolean;
      };
    }
  }
}
export {};
