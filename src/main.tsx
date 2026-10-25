import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Sell from './pages/Sell'
import Inventory from './pages/Inventory'
import History from './pages/History'
import Debts from './pages/Debts'
import Settings from './pages/Settings'
import Expenses from './pages/Expenses'
import Stats from './pages/Stats'
import Receipt from './pages/Receipt'
import Insights from './pages/Insights'
import AiChat from './pages/AiChat'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <div className="mx-auto flex min-h-screen max-w-md flex-col">
        <main className="flex-1 px-4 py-4 pb-20">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sell" element={<Sell />} />
            <Route path="/debts" element={<Debts />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/history" element={<History />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/receipt/:id" element={<Receipt />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/ask" element={<AiChat />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-stone-800 bg-stone-950/95 backdrop-blur">
          {[
            ['/', 'Today', '📊'],
            ['/sell', 'Sell', '🛒'],
            ['/debts', 'Credit', '📒'],
            ['/inventory', 'Stock', '📦'],
            ['/history', 'Sales', '🧾'],
          ].map(([to, label, icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center py-2.5 text-xs ${isActive ? 'text-emerald-400 font-semibold' : 'text-stone-500'}`
              }
            >
              <span className="text-lg">{icon}</span>
              {label}
            </NavLink>
          ))}
          <NavLink to="/settings" className={({ isActive }) => `flex flex-1 flex-col items-center py-2.5 text-xs ${isActive ? 'text-emerald-400 font-semibold' : 'text-stone-500'}`}>
            <span className="text-lg">⚙️</span>
            Backup
          </NavLink>
        </nav>
      </div>
    </BrowserRouter>
  </React.StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}
