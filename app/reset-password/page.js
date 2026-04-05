"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase";
import { useRouter } from "next/navigation";

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-orange-400" };
  if (score <= 3) return { score, label: "Good", color: "bg-yellow-400" };
  if (score <= 4) return { score, label: "Strong", color: "bg-green-400" };
  return { score, label: "Very Strong", color: "bg-green-600" };
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const strength = getPasswordStrength(password);

  useEffect(() => {
    async function verifyToken() {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      if (tokenHash && type === "recovery") {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });
        if (error) {
          setError("Invalid or expired reset link. Please request a new one.");
        } else {
          setReady(true);
        }
      } else {
        setError("Invalid reset link.");
      }
    }
    verifyToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleReset(e) {
    e.preventDefault();
    if (strength.score < 4) {
      setError("Please choose a stronger password.");
      return;
    }
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  if (!ready && !error) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black font-bold tracking-widest uppercase">
          Verifying reset link...
        </p>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black font-bold tracking-widest uppercase">
          Password updated. Redirecting...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-black text-black mb-8 tracking-tight">
          GESSO
        </h1>
        <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-6">
          Set New Password
        </p>
        {error && !ready ? (
          <div className="flex flex-col gap-4">
            <p className="text-red-600 text-sm">{error}</p>
            <a href="/login" className="text-black font-bold underline text-sm">
              Back to login
            </a>
          </div>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border border-black p-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
              />
              {password.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          i <= strength.score ? strength.color : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                      12+ chars, uppercase, numbers, symbols
                    </p>
                    <p
                      className={`text-xs font-bold tracking-widest uppercase ${
                        strength.score <= 2
                          ? "text-red-500"
                          : strength.score <= 3
                            ? "text-yellow-500"
                            : "text-green-600"
                      }`}
                    >
                      {strength.label}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white p.3 font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? "UPDATING..." : "SET NEW PASSWORD"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
