import { LeadForm } from "./lead-form";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">레슨 문의</h1>
          <p className="mt-1 text-sm text-gray-500">
            아래 내용을 남겨주시면 빠르게 연락드리겠습니다.
          </p>
        </header>
        <LeadForm />
      </div>
    </main>
  );
}
