import { BrowserRouter, Routes, Route } from 'react-router'
import { Toaster } from '@/components/ui/toaster'
import { AppLayout } from '@/pages/layout/AppLayout'

import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'

import Home from '@/pages/home/Home'
import MenuPage from '@/pages/menu/MenuPage'
import RecipeDetail from '@/pages/recipe/RecipeDetail'
import RecipeForm from '@/pages/recipe/RecipeForm'
import OrderList from '@/pages/order/OrderList'
import OrderCreate from '@/pages/order/OrderCreate'
import OrderDetailV2 from '@/pages/order/OrderDetailV2'
import WishList from '@/pages/wish/WishList'
import Favorites from '@/pages/favorites/Favorites'
import Profile from '@/pages/profile/Profile'
import Achievements from '@/pages/achievements/Achievements'
import PublicSharePage from '@/pages/share/PublicSharePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/share/:token" element={<PublicSharePage />} />
        
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/orders/:id" element={<OrderDetailV2 />} />
          <Route path="/order/create" element={<OrderCreate />} />
          <Route path="/menu/create-order" element={<OrderCreate />} />
          <Route path="/wishes" element={<WishList />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/recipe/new" element={<RecipeForm />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/recipe/:id/edit" element={<RecipeForm />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
