import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'
import Menu from './pages/Menu'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Profile from './pages/Profile'
import Totem from './pages/Totem'
import Kitchen from './pages/Kitchen'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import Register from './pages/Register'
import Privacy from './pages/Privacy'
import Loyalty from './pages/Loyalty'
import Promotions from './pages/Promotions'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/cardapio" element={<Menu />} />
          <Route path="/carrinho" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pedidos" element={<Orders />} />
          <Route path="/pedidos/:id" element={<OrderDetail />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/entrar" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/privacidade" element={<Privacy />} />
          <Route path="/fidelidade" element={<Loyalty />} />
          <Route path="/promocoes" element={<Promotions />} />
        </Route>

        <Route path="/totem" element={<Totem />} />

        <Route path="/cozinha" element={<Kitchen />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
