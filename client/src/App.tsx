import { Route, Routes } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Home from '@/pages/Home';
import PlaceholderPage from '@/pages/PlaceholderPage';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="courses" element={<PlaceholderPage title="Courses" />} />
        <Route path="live-classes" element={<PlaceholderPage title="Live Classes" />} />
        <Route path="about" element={<PlaceholderPage title="About" />} />
        <Route path="contact" element={<PlaceholderPage title="Contact" />} />
        <Route path="login" element={<PlaceholderPage title="Login" />} />
        <Route path="register" element={<PlaceholderPage title="Join VedaLearn" />} />
        <Route path="cart" element={<PlaceholderPage title="Your Cart" />} />
        <Route path="*" element={<PlaceholderPage title="Page not found" />} />
      </Route>
    </Routes>
  );
}
