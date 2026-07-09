"use client";

import { useEffect, useMemo, useState } from "react";

import { Credential, credentialApi, VerificationResult } from "@/features/credentials";

const fallbackCredentials: Credential[] = [
  {
    id: "vc-1001",
    subject: "AI Commerce 수료증",
    issuer: "CredLeaf Demo Issuer",
    status: "ACTIVE",
    expiresAt: "2027-12-31",
    verificationCount: 128,
  },
  {
    id: "vc-1002",
    subject: "Spring Boot 실무 인증",
    issuer: "CredLeaf Demo Issuer",
    status: "REVOKED",
    expiresAt: "2026-11-30",
    verificationCount: 31,
  },
];

const Home = () => {
  const [credentials, setCredentials] = useState<Credential[]>(fallbackCredentials);
  const [selectedId, setSelectedId] = useState(fallbackCredentials[0].id);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [lastAction, setLastAction] = useState("READY");

  const activeCount = useMemo(
    () => credentials.filter((item) => item.status === "ACTIVE").length,
    [credentials],
  );
  const verificationTotal = useMemo(
    () => credentials.reduce((sum, item) => sum + item.verificationCount, 0),
    [credentials],
  );

  useEffect(() => {
    credentialApi.list().then((items) => {
      setCredentials(items);
      setSelectedId(items[0]?.id ?? fallbackCredentials[0].id);
    }).catch(() => setCredentials(fallbackCredentials));
  }, []);

  const refresh = async () => {
    const items = await credentialApi.list();
    setCredentials(items);
    if (!items.some((item) => item.id === selectedId)) {
      setSelectedId(items[0]?.id ?? "");
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
  };

  const verifyCredential = async () => {
    const result = await credentialApi.verify(selectedId);
    setVerification(result);
    setCredentials((current) => current.map((item) => (
      item.id === result.credentialId && result.metrics.verificationCount
        ? { ...item, verificationCount: result.metrics.verificationCount }
        : item
    )));
    setLastAction(result.valid ? "VERIFIED" : "VERIFY_FAILED");
  };

  const revokeCredential = async () => {
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
          <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5" aria-live="polite">
            <h2 className="font-semibold">Verification result</h2>
            <p className="text-sm text-zinc-700">
              {verification.credentialId} · {verification.status} · {verification.valid ? "valid" : "invalid"}
            </p>
          </section>
        ) : null}

        <section className="overflow-hidden rounded-lg border">
          <div className="border-b bg-zinc-50 px-5 py-3 font-medium">Credential status</div>
          <div className="divide-y">
            {credentials.map((item) => (
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
      </section>
    </main>
  );
};

export default Home;
