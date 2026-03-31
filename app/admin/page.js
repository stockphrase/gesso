"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/AdminHeader";

const adminTiles = [
  {
    title: "ANNOUNCEMENTS",
    description: "Post and manage announcements",
    href: "/admin/announcements",
  },
  {
    title: "COURSES",
    description: "Manage courses and rosters",
    href: "/admin/courses",
  },
  {
    title: "ASSIGNMENTS",
    description: "Manage assignments and grades",
    href: "/admin/assignments",
  },
  {
    title: "SYLLABUS",
    description: "Edit the course syllabus",
    href: "/admin/syllabus",
  },
  {
    title: "CONTACT",
    description: "Edit contact information",
    href: "/admin/contact",
  },
  {
    title: "FILES",
    description: "Upload and manage course files",
    href: "/admin/files",
  },
];

export default function AdminPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      setProfile(profile);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black font-bold">LOADING...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <AdminHeader backHref="/dashboard" name={profile?.name} />

      {/* Title */}
      <div className="px-8 py-10 border-b border-gray-200">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
          Admin
        </p>
        <h2 className="text-3xl font-black text-black tracking-tight">
          ADMIN PANEL
        </h2>
      </div>

      {/* Tile grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-black m-8">
        {adminTiles.map((tile) => (
          <a
            key={tile.title}
            href={tile.href}
            className="bg-white p-8 flex flex-col justify-between min-h-48 hover:bg-black hover:text-white transition-colors group"
          >
            <h3 className="text-xl font-black text-black group-hover:text-white tracking-tight">
              {tile.title}
            </h3>
            <p className="text-sm text-gray-500 group-hover:text-gray-300 mt-4">
              {tile.description}
            </p>
          </a>
        ))}
      </div>
    </main>
  );
}
