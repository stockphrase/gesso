'use client'
import { useRouter } from 'next/navigation'
import { clearActiveCourse, getActiveCourse } from '@/utils/course'
import { useEffect, useState } from 'react'

export default function Header({ backHref = '/dashboard', name = '', showBack = true, onBack = null }) {
  const router = useRouter()
  const [courseName, setCourseName] = useState('')

  useEffect(() => {
    const course = getActiveCourse()
    if (course?.name) setCourseName(course.name)
  }, [])

  function handleSwitchCourse() {
    clearActiveCourse()
    router.push('/courses')
  }

  return (
    <header className="border-b border-black px-4 md:px-8 py-4 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 shrink-0">
        <h1 className="text-xl md:text-2xl font-black tracking-tight text-black">GESSO</h1>
        {courseName && (
          <span className="text-xs font-bold tracking-widest uppercase text-gray-400 hidden sm:inline">
            {courseName}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4 flex-wrap justify-end">
        {name && <span className="text-xs text-gray-600 hidden md:inline">{name}</span>}
        <button onClick={handleSwitchCourse}
          className="text-xs font-bold text-black border border-black px-3 py-2 md:px-4 md:py-2 hover:bg-black hover:text-white transition-colors whitespace-nowrap">
          Switch Course
        </button>
        {showBack && (
          onBack ? (
            <button onClick={onBack}
              className="text-xs font-bold text-black border border-black px-3 py-2 md:px-4 md:py-2 hover:bg-black hover:text-white transition-colors">
              Back
            </button>
          ) : (
            <a href={backHref}
              className="text-xs font-bold text-black border border-black px-3 py-2 md:px-4 md:py-2 hover:bg-black hover:text-white transition-colors">
              Back
            </a>
          )
        )}
      </div>
    </header>
  )
}
