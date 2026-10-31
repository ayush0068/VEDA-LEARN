import { Route, Routes } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Cart from '@/pages/Cart';
import About from '@/pages/About';
import CourseDetail from '@/pages/CourseDetail';
import Courses from '@/pages/Courses';
import Home from '@/pages/Home';
import LiveClassDetail from '@/pages/LiveClassDetail';
import LiveClasses from '@/pages/LiveClasses';
import Login from '@/pages/Login';
import PlaceholderPage from '@/pages/PlaceholderPage';
import Register from '@/pages/Register';

export default function App() {
  return (
    <Routes>
      {/* Login / Register have their own full-screen layout (no navbar / footer) */}
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />

      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:slug" element={<CourseDetail />} />
        <Route path="live-classes" element={<LiveClasses />} />
        <Route path="live-classes/:id" element={<LiveClassDetail />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<PlaceholderPage title="Contact" />} />
        <Route path="forgot-password" element={<PlaceholderPage title="Reset Password" />} />
        <Route path="profile" element={<PlaceholderPage title="My Profile" />} />
        <Route path="dashboard" element={<PlaceholderPage title="My Dashboard" />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<PlaceholderPage title="Checkout" />} />
        <Route path="faq" element={<PlaceholderPage title="FAQ" />} />
        <Route path="terms" element={<PlaceholderPage title="Terms & Conditions" />} />
        <Route path="privacy" element={<PlaceholderPage title="Privacy Policy" />} />
        <Route path="refund-policy" element={<PlaceholderPage title="Refund Policy" />} />
        <Route path="support" element={<PlaceholderPage title="Support" />} />
        <Route path="*" element={<PlaceholderPage title="Page not found" />} />
      </Route>
    </Routes>
  );
}