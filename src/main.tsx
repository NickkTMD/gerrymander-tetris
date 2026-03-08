import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Library from './pages/Library.tsx'
import Leaderboard from './pages/Leaderboard.tsx'
import NavBar from './components/NavBar.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/library" element={<Library />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/about" element={<div style={{ padding: '2rem', color: '#888' }}>Coming soon.</div>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
