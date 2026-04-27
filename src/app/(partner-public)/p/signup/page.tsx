import { prisma } from "@/lib/db";
import { SignupForm } from "./SignupForm";

export const dynamic = "force-dynamic";

async function getCities() {
  try {
    return await prisma.city.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, state: true },
    });
  } catch {
    return [];
  }
}

export default async function PartnerSignupPage() {
  const cities = await getCities();
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-brand-50 via-white to-brand-100 p-4">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 mt-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-xl font-black text-white">
            GG
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Partner Signup
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Join Glimmora Go — book rides on behalf of your customers
          </p>
        </div>
        <SignupForm cities={cities} />
        <p className="mt-6 text-center text-xs text-slate-500">
          Already a partner?{" "}
          <a href="/p/login" className="font-medium text-brand-600">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
