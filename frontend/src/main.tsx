import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './theme.css'
import Cursor from './components/cursor'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Cursor />
  </StrictMode>,
)


