import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { Navbar } from "@/components/lifegrid/Navbar";
import { Footer } from "@/components/lifegrid/Footer";
import { AuthForm } from "@/components/lifegrid/AuthForm";
import { useStore } from "@/lib/lifegrid-store";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — LifeGrid" },
      { name: "description", content: "Sign in to LifeGrid as a patient, hospital operator, or admin." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user } = useStore();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  const goAfterLogin = () => {
    navigate({ to: (redirect as "/") || "/", replace: true });
  };

  useEffect(() => {
    if (user) goAfterLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, redirect]);

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-card border border-border rounded-2xl shadow-lg p-6 slide-up">
          <div className="flex flex-col items-center text-center mb-6">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white heartbeat">
              <i className="fa-solid fa-heart-pulse text-2xl" />
            </span>
            <h1 className="mt-3 font-display text-2xl font-bold">Welcome Back</h1>
            <p className="text-sm text-text-secondary">Sign in to book beds and manage your requests.</p>
          </div>
          <AuthForm onSuccess={goAfterLogin} />
          <div className="mt-6 text-center text-xs text-text-secondary space-y-2">
            <p>Don't have an account? Contact us to register.</p>
            <div className="flex flex-col gap-1.5">
              <Link to="/" className="text-primary font-semibold">
                ← Back to LifeGrid
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
