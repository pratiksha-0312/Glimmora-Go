import { LoginForm } from "./LoginForm";

export default function KiranaLoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-brand-50 via-white to-orange-50 p-4">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 mt-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-xl font-black text-white">
            GG
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Kirana Partner Sign In
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter your phone to receive an OTP
          </p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-slate-500">
          New here?{" "}
          <a href="/k/signup" className="font-medium text-brand-600">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
