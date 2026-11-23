import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'
import Menu from './pages/Menu'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import Profile from './pages/Profile'
import Totem from './pages/Totem'
import Kitchen from './pages/Kitchen'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/cardapio" element={<Menu />} />
          <Route path="/carrinho" element={<Cart />} />
          <Route path="/pedidos" element={<Orders />} />
          <Route path="/perfil" element={<Profile />} />
        </Route>

        <Route path="/totem" element={<Totem />} />

        <Route path="/cozinha" element={<Kitchen />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
