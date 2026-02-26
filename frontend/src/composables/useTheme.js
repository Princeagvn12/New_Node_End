export function initTheme() {
  try {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = stored ? stored === 'dark' : prefersDark
    setThemeClass(isDark)
  } catch (e) {
    // ignore
  }
}

export function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark')
  try {
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  } catch (e) {}
}

function setThemeClass(isDark) {
  if (isDark) document.documentElement.classList.add('dark')
  else document.documentElement.classList.remove('dark')
}
