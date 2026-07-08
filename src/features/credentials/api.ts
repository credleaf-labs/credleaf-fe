import ky from "ky";

export type CredentialStatus = "ACTIVE" | "REVOKED" | "EXPIRED";

export type Credential = {
  id: string;
  subject: string;
  issuer: string;
  status: CredentialStatus;
  expiresAt: string;
  verificationCount: number;
};

export type AuditLog = {
  id: string;
  action: string;
  targetId: string;
  createdAt: string;
};

const api = ky.create({
  prefix: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api",
  timeout: 8000,
});

export const credentialApi = {
  list: () => api.get("credentials").json<Credential[]>(),
  auditLogs: () => api.get("audit-logs").json<AuditLog[]>(),
};
