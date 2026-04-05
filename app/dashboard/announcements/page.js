"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase";
import Header from "@/components/Header";
import { getActiveCourse } from "@/utils/course";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const course = getActiveCourse();
    if (!course) {
      router.push("/courses");
      return;
    }

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("announcements")
        .select("*")
        .eq("course_id", course.id)
        .order("date", { ascending: false });

      setAnnouncements(data || []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleExpanded(id) {
    setExpanded(expanded === id ? null : id);
  }

  function linkify(text) {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    return text.split(urlPattern).map((part, i) =>
      urlPattern.test(part) ? (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-bold hover:text-gray-500"
        >
          {part}
        </a>
      ) : (
        part
      ),
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black font-bold">LOADING...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Header backHref="/dashboard" />
      <div className="px-8 py-10 border-b border-gray-200">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
          Course
        </p>
        <h2 className="text-3xl font-black text-black tracking-tight">
          ANNOUNCEMENTS
        </h2>
      </div>
      <div className="px-8 py-8">
        {announcements.length === 0 ? (
          <p className="text-gray-400 text-sm">No announcements yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-200">
            {announcements.map((a) => (
              <div key={a.id}>
                <button
                  onClick={() => toggleExpanded(a.id)}
                  className="w-full flex items-center justify-between py-5 text-left hover:bg-gray-50 transition-colors px-2 group"
                >
                  <div className="flex items-center gap-8">
                    <span className="text-xs font-mono text-gray-400 w-20 shrink-0">
                      {a.date}
                    </span>
                    <span className="text-sm font-bold text-black group-hover:underline">
                      {a.title}
                    </span>
                  </div>
                  <span className="text-gray-400 text-sm ml-4">
                    {expanded === a.id ? "−" : "+"}
                  </span>
                </button>
                {expanded === a.id && (
                  <div className="px-2 pb-6 ml-28">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {linkify(a.body)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
