import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import SideBar from './components/sidebar/sidebar.jsx'

// Import des pages
import Dashboard from './pages/Dashboard.jsx'
import Comptes from './pages/Comptes.jsx'
import Transactions from './pages/Transactions.jsx'
import Categories from './pages/Categories.jsx'
import Budgets from './pages/Budgets.jsx'
import Parametres from './pages/Parametres.jsx'
import Auth from './pages/Auth.jsx'
import Profil from './pages/Profil.jsx'
import Avances from './pages/Avances.jsx'

// Import des styles
import './styles/App.css'

// Composant pour protéger les routes
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/auth" replace />
  }

  return children
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const token = localStorage.getItem('token')
  const storedUser = localStorage.getItem('user')
  const user = storedUser ? JSON.parse(storedUser) : null
  const location = useLocation()

  const authPages = ['/auth', '/login', '/register']
  const isAuthPage = authPages.includes(location.pathname)

  // Si on est sur une page d'auth et qu'on est déjà connecté, rediriger vers /
  if (isAuthPage && token) {
    return <Navigate to="/" replace />
  }

  const tableau_pages = [
    { nom: "Dashboard", lien: "/", icon: "home" },
    { nom: "Budgets", lien: "/budgets", icon: "budget" },
    { nom: "Comptes", lien: "/comptes", icon: "bank" },
    { nom: "Transactions", lien: "/transactions", icon: "transaction" },
    { nom: "Remboursements", lien: "/avances", icon: "advance" },
    { nom: "Catégories", lien: "/categories", icon: "category" },
  ]

  return (
    <div className={isAuthPage ? "auth-container" : "app-container"}>
      {!isAuthPage && (
        <SideBar
          setSidebarOpen={setSidebarOpen}
          sidebar_open={sidebarOpen}
          user={user}
          tab_pages={tableau_pages}
        />
      )}
      <div id='main'>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Navigate to="/auth" />} />
          <Route path="/register" element={<Navigate to="/auth" />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/home" element={<Navigate to="/" />} />
          <Route path="/comptes" element={<ProtectedRoute><Comptes /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
          <Route path="/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
          <Route path="/avances" element={<ProtectedRoute><Avances /></ProtectedRoute>} />
          <Route path="/profil" element={<ProtectedRoute><Profil /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to={token ? "/" : "/auth"} />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
