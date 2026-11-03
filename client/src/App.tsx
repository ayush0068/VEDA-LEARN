import { Navigate, Route, Routes } from 'react-router-dom';
import RequireAuth from '@/components/auth/RequireAuth';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import MainLayout from '@/components/layout/MainLayout';
import NotificationsSection from '@/components/profile/NotificationsSection';
import OrdersSection from '@/components/profile/OrdersSection';
import OverviewSection from '@/components/profile/OverviewSection';
import PersonalSection from '@/components/profile/PersonalSection';
import PrivacySection from '@/components/profile/PrivacySection';
import SecuritySection from '@/components/profile/SecuritySection';
import WishlistSection from '@/components/profile/WishlistSection';
import Cart from '@/pages/Cart';
import Contact from '@/pages/Contact';
import About from '@/pages/About';
import CourseDetail from '@/pages/CourseDetail';
import Courses from '@/pages/Courses';
import DashboardComingSoon from '@/pages/DashboardComingSoon';
import DashboardMyCourses from '@/pages/DashboardMyCourses';
import Home from '@/pages/Home';
import LiveClassDetail from '@/pages/LiveClassDetail';
import LiveClasses from '@/pages/LiveClasses';
import Login from '@/pages/Login';
import PlaceholderPage from '@/pages/PlaceholderPage';
import Profile from '@/pages/Profile';
import Register from '@/pages/Register';
import StudentDashboard from '@/pages/StudentDashboard';

export default function App() {
  return (
    <Routes>
      {/* Login / Register have their own full-screen layout (no navbar / footer) */}
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />

      {/* Student area: signed-in students only, own layout (top bar + side menu), no website footer */}
      <Route path="dashboard" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
        <Route index element={<StudentDashboard />} />
        <Route path="my-courses" element={<DashboardMyCourses />} />
        <Route path=":section" element={<DashboardComingSoon />} />
      </Route>

      {/* My Profile: signed-in students only, own layout (dashboard top bar + banner + section menu) */}
      <Route path="profile" element={<RequireAuth><Profile /></RequireAuth>}>
        <Route index element={<OverviewSection />} />
        <Route path="personal" element={<PersonalSection />} />
        <Route path="security" element={<SecuritySection />} />
        <Route path="notifications" element={<NotificationsSection />} />
        <Route path="orders" element={<OrdersSection />} />
        <Route path="wishlist" element={<WishlistSection />} />
        <Route path="privacy" element={<PrivacySection />} />
        <Route path="*" element={<Navigate to="/profile" replace />} />
      </Route>

      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:slug" element={<CourseDetail />} />
        <Route path="live-classes" element={<LiveClasses />} />
        <Route path="live-classes/:id" element={<LiveClassDetail />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="forgot-password" element={<PlaceholderPage title="Reset Password" />} />
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