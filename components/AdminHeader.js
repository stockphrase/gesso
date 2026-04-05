"use client";
import { useRouter } from "next/navigation";
import { clearActiveCourse, getActiveCourse } from "@/utils/course";
export default function AdminHeader({
  backHref = "/admin",
  name = "",
  onBack = null,
}) {
  const router = useRouter();
  const course = getActiveCourse();
  const courseName = course?.name ?? "";
  function handleSwitchCourse() {
    clearActiveCourse();
    router.push("/courses");
  }
  return (
    <>
      {/* Course editing banner */}
      <div className="w-full bg-red-600 px-4 py-2 flex items-center justify-center">
        <p className="text-xs font-black tracking-widest uppercase text-white text-center">
          Editing — {courseName || "..."}
        </p>
      </div>
      {/* Header */}
      <header className="border-b border-black px-4 md:px-8 py-4 flex items-center justify-between bg-gray-100 gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-black">
            GESSO
          </h1>
          <span className="text-xs font-black tracking-widest text-white bg-red-600 px-2 py-1 hidden sm:inline">
            ADMIN
          </span>
        </div>
        <div className="flex items-center gap-4 flex-wrap justify-end">
          {name && (
            <span className="text-xs text-gray-600 hidden md:inline">
              {name}
            </span>
          )}
          <button
            onClick={handleSwitchCourse}
            className="text-xs font-bold text-black border border-black px-3 py-2 md:px-4 md:py-2 hover:bg-black hover:text-white transition-colors whitespace-nowrap"
          >
            Switch Course
          </button>
          {onBack ? (
            <button
              onClick={onBack}
              className="text-xs font-bold text-black border border-black px-3 py-2 md:px-4 md:py-2 hover:bg-black hover:text-white transition-colors"
            >
              Back
            </button>
          ) : (
            <a
              href={backHref}
              className="text-xs font-bold text-black border border-black px-3 py-2 md:px-4 md:py-2 hover:bg-black hover:text-white transition-colors"
            >
              Back
            </a>
          )}
        </div>
      </header>
    </>
  );
}
