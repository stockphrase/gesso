// Active course cookie helpers — client side only

const COOKIE_NAME = 'gesso_active_course'

export function setActiveCourse(courseId, courseName) {
  const val = JSON.stringify({ id: courseId, name: courseName })
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(val)}; path=/; max-age=86400`
}

export function getActiveCourse() {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${COOKIE_NAME}=`))
  if (!match) return null
  try {
    return JSON.parse(decodeURIComponent(match.split('=').slice(1).join('=')))
  } catch {
    return null
  }
}

export function clearActiveCourse() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`
}
