"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, getAuthState } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alteredId, setAlteredId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const authState = getAuthState();
    if (authState.isAuthenticated) {
      router.push("/my-vault");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(email, password, alteredId);
      router.push("/my-vault");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-background border border-black/[.08] dark:border-white/[.145] rounded-lg p-8 shadow-sm">
          <h1 className="text-2xl font-semibold mb-6 text-center">
            Create Account
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-black/[.08] dark:border-white/[.145] rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="alteredId"
                className="block text-sm font-medium mb-2"
              >
                Altered ID
              </label>
              <input
                id="alteredId"
                type="text"
                value={alteredId}
                onChange={(e) => setAlteredId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-black/[.08] dark:border-white/[.145] rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                placeholder="Enter your altered ID"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-black/[.08] dark:border-white/[.145] rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Register"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-foreground/70">
              Already have an account?{" "}
            </span>
            <Link
              href="/login"
              className="text-foreground hover:underline font-medium"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
