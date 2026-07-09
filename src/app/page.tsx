"use client";

import { useEffect, useMemo, useState } from "react";

import { AuditLog, Credential, credentialApi, CredentialStatus, VerificationResult } from "@/features/credentials";

const statusCopy: Record<CredentialStatus | "NOT_FOUND", { label: string; style: string }> = {
  ACTIVE: { label: "유효", style: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  EXPIRED: { label: "만료", style: "border-amber-200 bg-amber-50 text-amber-800" },
  NOT_FOUND: { label: "찾을 수 없음", style: "border-zinc-200 bg-zinc-50 text-zinc-700" },
  REVOKED: { label: "폐기", style: "border-red-200 bg-red-50 text-red-800" },
};

const pageSize = 5;

const Home = () => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [lastAction, setLastAction] = useState("READY");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | CredentialStatus>("ALL");
  const [auditCursor, setAuditCursor] = useState(0);

  const activeCount = useMemo(
    () => credentials.filter((item) => item.status === "ACTIVE").length,
    [credentials],
  );
  const verificationTotal = useMemo(
    () => credentials.reduce((sum, item) => sum + item.verificationCount, 0),
    [credentials],
  );
  const filteredAuditLogs = useMemo(() => auditLogs.filter((item) => {
    const keyword = auditSearch.trim().toLowerCase();
    return !keyword || `${item.action} ${item.targetId}`.toLowerCase().includes(keyword);
  }), [auditLogs, auditSearch]);
  const visibleAuditLogs = filteredAuditLogs.slice(auditCursor, auditCursor + pageSize);
  const visibleCredentials = useMemo(() => credentials.filter((item) => (
    statusFilter === "ALL" || item.status === statusFilter
  )), [credentials, statusFilter]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      credentialApi.list(),
      credentialApi.auditLogs(),
    ]).then(([items, logs]) => {
      if (cancelled) {
        return;
      }

      setCredentials(items);
      setAuditLogs(logs);
      setSelectedId(items[0]?.id ?? "");
      setErrorMessage("");
    }).catch(() => {
      if (cancelled) {
        return;
      }

      setCredentials([]);
      setAuditLogs([]);
      setErrorMessage("Credential API 연결을 확인할 수 없습니다.");
    }).finally(() => {
      if (!cancelled) {
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = async () => {
    try {
      const [items, logs] = await Promise.all([
        credentialApi.list(),
        credentialApi.auditLogs(),
      ]);
      setCredentials(items);
      setAuditLogs(logs);
      setErrorMessage("");
      if (!items.some((item) => item.id === selectedId)) {
        setSelectedId(items[0]?.id ?? "");
      }
    } catch {
      setCredentials([]);
      setAuditLogs([]);
      setErrorMessage("Credential API 연결을 확인할 수 없습니다.");
    }
  };

  const issueCredential = async () => {
    const issued = await credentialApi.issue({
      subject: `검증 자동화 증명 ${credentials.length + 1}`,
      issuer: "CredLeaf Demo Issuer",
    });
    setCredentials((current) => [...current, issued]);
    setSelectedId(issued.id);
    setLastAction("ISSUED");
    await refresh().catch(() => undefined);
  };

  const verifyCredential = async () => {
    if (!selectedId) {
      setVerification({ credentialId: "unknown", metrics: {}, status: "NOT_FOUND", valid: false });
      setLastAction("VERIFY_FAILED");
      return;
    }
    const result = await credentialApi.verify(selectedId);
    setVerification(result);
    setCredentials((current) => current.map((item) => (
      item.id === result.credentialId && result.metrics.verificationCount
        ? { ...item, verificationCount: result.metrics.verificationCount }
        : item
    )));
    setLastAction(result.valid ? "VERIFIED" : "VERIFY_FAILED");
    await refresh().catch(() => undefined);
  };

  const revokeCredential = async () => {
    if (!selectedId) {
      return;
    }
    const revoked = await credentialApi.revoke(selectedId);
    setCredentials((current) => current.map((item) => (item.id === revoked.id ? revoked : item)));
    setLastAction("REVOKED");
    await refresh().catch(() => undefined);
  };

  return (
    <main>
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">DID credential operations</p>
          <h1 className="text-4xl font-semibold">CredLeaf credential lifecycle console</h1>
          <p className="max-w-2xl text-zinc-600">
            발급, 검증, 폐기, 감사 로그를 한 흐름으로 묶어 DID 증명 운영 상태를 확인한다.
          </p>
          {errorMessage ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{errorMessage}</p> : null}
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border p-5">
            <p className="text-sm text-zinc-600">Active credentials</p>
            <strong className="text-3xl">{activeCount}</strong>
          </article>
          <article className="rounded-lg border p-5">
            <p className="text-sm text-zinc-600">Verification events</p>
            <strong className="text-3xl">{verificationTotal}</strong>
          </article>
          <article className="rounded-lg border p-5">
            <p className="text-sm text-zinc-600">Last lifecycle action</p>
            <strong className="text-3xl">{lastAction}</strong>
          </article>
        </div>

        <section className="grid gap-3 rounded-lg border p-5 md:grid-cols-[1fr_auto_auto_auto]">
          <label className="grid gap-2 text-sm font-medium text-zinc-700">
            Credential
            <select
              aria-label="Credential"
              className="rounded-md border px-3 py-2"
              onChange={(event) => setSelectedId(event.target.value)}
              value={selectedId}
            >
              <option value="">검증할 증명 선택</option>
              {credentials.map((item) => (
                <option key={item.id} value={item.id}>{item.subject}</option>
              ))}
            </select>
          </label>
          <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white" onClick={issueCredential}>
            Issue
          </button>
          <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white" onClick={verifyCredential}>
            Verify
          </button>
          <button className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900" onClick={revokeCredential}>
            Revoke
          </button>
        </section>

        {verification ? (
          <section className={`rounded-lg border p-5 ${statusCopy[verification.status].style}`} aria-live="polite">
            <h2 className="font-semibold">QR 검증 결과 · {statusCopy[verification.status].label}</h2>
            <p className="text-sm text-zinc-700">
              {verification.credentialId} · {verification.status} · {verification.valid ? "valid" : "invalid"}
            </p>
          </section>
        ) : null}

        <section className="overflow-hidden rounded-lg border">
          <div className="grid gap-3 border-b bg-zinc-50 px-5 py-3 md:grid-cols-[1fr_auto] md:items-center">
            <div className="font-medium">Credential status</div>
            <select
              aria-label="Credential status filter"
              className="rounded-md border px-3 py-2 text-sm"
              onChange={(event) => setStatusFilter(event.target.value as "ALL" | CredentialStatus)}
              value={statusFilter}
            >
              <option value="ALL">전체 상태</option>
              <option value="ACTIVE">유효</option>
              <option value="EXPIRED">만료</option>
              <option value="REVOKED">폐기</option>
            </select>
          </div>
          <div className="divide-y">
            {isLoading ? <p className="px-5 py-4 text-sm text-zinc-600">증명을 불러오는 중입니다.</p> : null}
            {!isLoading && visibleCredentials.length === 0 ? (
              <p className="px-5 py-4 text-sm text-zinc-600">현재 조건에 맞는 증명이 없습니다.</p>
            ) : null}
            {visibleCredentials.map((item) => (
              <article className="grid gap-2 px-5 py-4 md:grid-cols-[1fr_auto]" key={item.id}>
                <div>
                  <h2 className="font-semibold">{item.subject}</h2>
                  <p className="text-sm text-zinc-600">{item.issuer} · expires {item.expiresAt} · verified {item.verificationCount}</p>
                </div>
                <span className="rounded-full bg-zinc-900 px-3 py-1 text-sm text-white">{item.status}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border">
          <div className="grid gap-3 border-b bg-zinc-50 px-5 py-3 md:grid-cols-[1fr_auto_auto] md:items-center">
            <div className="font-medium">Audit log</div>
            <input
              aria-label="Audit log search"
              className="rounded-md border px-3 py-2 text-sm"
              onChange={(event) => {
                setAuditSearch(event.target.value);
                setAuditCursor(0);
              }}
              placeholder="action 또는 target 검색"
              value={auditSearch}
            />
            <div className="flex gap-2">
              <button
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold disabled:opacity-40"
                disabled={auditCursor === 0}
                onClick={() => setAuditCursor((cursor) => Math.max(0, cursor - pageSize))}
                type="button"
              >
                Prev
              </button>
              <button
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold disabled:opacity-40"
                disabled={auditCursor + pageSize >= filteredAuditLogs.length}
                onClick={() => setAuditCursor((cursor) => cursor + pageSize)}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
          <div className="divide-y">
            {visibleAuditLogs.length === 0 ? <p className="px-5 py-4 text-sm text-zinc-600">감사 로그가 없습니다.</p> : null}
            {visibleAuditLogs.map((item) => (
              <article className="grid gap-2 px-5 py-4 md:grid-cols-[1fr_auto]" key={item.id}>
                <div>
                  <h2 className="font-semibold">{item.action}</h2>
                  <p className="break-all text-sm text-zinc-600">{item.targetId}</p>
                </div>
                <span className="text-sm text-zinc-600">{item.createdAt}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
};

export default Home;
