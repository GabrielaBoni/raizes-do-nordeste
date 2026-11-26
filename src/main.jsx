import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import UnitProvider from './contexts/UnitProvider.jsx'
import CartProvider from './contexts/CartProvider.jsx'
import AuthProvider from './contexts/AuthProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <UnitProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </UnitProvider>
    </AuthProvider>
  </StrictMode>,
)
