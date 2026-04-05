"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function redirect() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        router.push("/courses");
      } else {
        router.push("/login");
      }
    }
    redirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-black font-bold tracking-widest uppercase">
        Loading...
      </p>
    </main>
  );
}
