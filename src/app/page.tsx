import { credentialApi } from "@/features/credentials";

const fallbackCredentials = [
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
] as const;

const loadCredentials = async () => {
  try {
    return await credentialApi.list();
  } catch {
    return fallbackCredentials;
  }
};

const Home = async () => {
  const credentials = await loadCredentials();
  const activeCount = credentials.filter((item) => item.status === "ACTIVE").length;

  return (
    <main>
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">DID credential operations</p>
          <h1 className="text-4xl font-semibold">CredLeaf credential lifecycle console</h1>
          <p className="max-w-2xl text-zinc-600">
            발급, 검증, 폐기, 감사 로그를 한 흐름으로 묶어 BDGEN의 DID/증명 도메인에 맞춘 운영 증거를 만든다.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border p-5">
            <p className="text-sm text-zinc-500">Active credentials</p>
            <strong className="text-3xl">{activeCount}</strong>
          </article>
          <article className="rounded-lg border p-5">
            <p className="text-sm text-zinc-500">Verification events</p>
            <strong className="text-3xl">{credentials.reduce((sum, item) => sum + item.verificationCount, 0)}</strong>
          </article>
          <article className="rounded-lg border p-5">
            <p className="text-sm text-zinc-500">Compiler</p>
            <strong className="text-3xl">React</strong>
          </article>
        </div>

        <section className="overflow-hidden rounded-lg border">
          <div className="border-b bg-zinc-50 px-5 py-3 font-medium">Credential status</div>
          <div className="divide-y">
            {credentials.map((item) => (
              <article className="grid gap-2 px-5 py-4 md:grid-cols-[1fr_auto]" key={item.id}>
                <div>
                  <h2 className="font-semibold">{item.subject}</h2>
                  <p className="text-sm text-zinc-500">{item.issuer} · expires {item.expiresAt}</p>
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
