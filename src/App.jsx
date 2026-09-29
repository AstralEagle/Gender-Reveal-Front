import { useEffect, useState } from 'react'
import Results from './pages/Results.jsx'
import Prediction from './pages/Prediction.jsx'
import Admin from './pages/Admin.jsx'
import './App.css'

const ROUTES = {
  '/': Results,
  '/parier': Prediction,
  '/admin': Admin,
}

function currentPath() {
  const path = window.location.hash.replace(/^#/, '') || '/'
  return ROUTES[path] ? path : '/'
}

export default function App() {
  const [path, setPath] = useState(currentPath)

  useEffect(() => {
    const onHash = () => setPath(currentPath())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const Page = ROUTES[path]
  return (
    <main>
      <Page />
    </main>
  )
}
