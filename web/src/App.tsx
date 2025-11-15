import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Vault from './pages/Vault'
import Borrow from './pages/Borrow'
import Harvest from './pages/Harvest'
import Positions from './pages/Positions'
import Docs from './pages/Docs'
import Admin from './pages/Admin'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/vault" element={<Vault />} />
        <Route path="/borrow" element={<Borrow />} />
        <Route path="/harvest" element={<Harvest />} />
        <Route path="/positions" element={<Positions />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Layout>
  )
}

export default App

