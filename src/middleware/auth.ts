import { Request, Response, NextFunction } from "express";
import { adminAuth } from "../lib/firebase-admin.ts";
import { DecodedIdToken } from "firebase-admin/auth";
import { ClinicalRole } from "../types.ts";

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

/**
 * Validates the Firebase Auth Bearer token and populates req.user
 */
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
};

/**
 * Enforces that the authenticated user possesses specific Custom Claims roles.
 * Custom claims reside securely in token.role or token.isSupervisor.
 */
export const requireRole = (allowedRoles: ClinicalRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: Authentication required" });
    }

    const userRole = (req.user.role as ClinicalRole) || "odontologo";
    const isSupervisor = Boolean(req.user.isSupervisor);
    const isSuperAdmin = Boolean(req.user.superadmin) || userRole === "superadmin";

    // Superadmin bypasses role checks
    if (isSuperAdmin) {
      return next();
    }

    // If supervisor is accepted and user has isSupervisor claim
    if (allowedRoles.includes("supervisor") && isSupervisor) {
      return next();
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: "Forbidden: Privilegios insuficientes para ejecutar esta acción clínica.",
        requiredRoles: allowedRoles,
        userRole,
      });
    }

    next();
  };
};

/**
 * Quick guard for Admin and Supervisor operations
 */
export const requireAdminOrSupervisor = requireRole(["admin", "supervisor", "superadmin"]);
