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
    <header className="border-b border-black px-8 py-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-black tracking-tight text-black">GESSO</h1>
        {courseName && (
          <span className="text-xs font-bold tracking-widest uppercase text-gray-400">{courseName}</span>
        )}
      </div>
      <div className="flex items-center gap-4">
        {name && <span className="text-sm text-gray-600">{name}</span>}
        <button
          onClick={handleSwitchCourse}
          className="text-sm font-bold text-black border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
        >
          Switch Course
        </button>
        {showBack && (
          onBack ? (
            <button onClick={onBack}
              className="text-sm font-bold text-black border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">
              BACK
            </button>
          ) : (
            <a href={backHref}
              className="text-sm font-bold text-black border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">
              BACK
            </a>
          )
        )}
      </div>
    </header>
  )
}
