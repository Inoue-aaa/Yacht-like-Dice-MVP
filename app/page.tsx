import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-8">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="mb-4 text-3xl font-bold">Dice Game MVP</h1>
        <p className="mb-6 text-zinc-600">
          1人用のヨット風サイコロゲームです。Play から開始してください。
        </p>
        <Link
          href="/game"
          className="inline-flex rounded-md bg-zinc-900 px-5 py-3 font-semibold text-white transition-colors hover:bg-zinc-700"
        >
          Play
        </Link>
      </div>
    </main>
  );
}
