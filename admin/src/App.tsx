import { Route, Routes } from 'react-router-dom';
import RequireAdmin from '@/components/auth/RequireAdmin';
import AdminLayout from '@/components/layout/AdminLayout';
import ComingSoon from '@/pages/ComingSoon';
import Courses from '@/pages/Courses';
import Dashboard from '@/pages/Dashboard';
import Instructors from '@/pages/Instructors';
import LiveClasses from '@/pages/LiveClasses';
import LiveRoomHost from '@/pages/LiveRoomHost';
import Login from '@/pages/Login';
import Students from '@/pages/Students';

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />

      {/* the teaching room fills the whole screen, so it sits outside the panel layout */}
      <Route
        path="live-classes/:id/room"
        element={
          <RequireAdmin>
            <LiveRoomHost />
          </RequireAdmin>
        }
      />

      <Route
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/new" element={<Courses startWithAdd />} />
        <Route path="instructors" element={<Instructors />} />
        <Route path="instructors/new" element={<Instructors startWithAdd />} />
        <Route path="students" element={<Students />} />
        {/* "Add Student" quick action on the dashboard opens the same page with the form already open */}
        <Route path="students/new" element={<Students startWithAdd />} />
        <Route path="live-classes" element={<LiveClasses />} />
        {/* every other sidebar item opens a placeholder until its screen is built */}
        <Route path="*" element={<ComingSoon />} />
      </Route>
    </Routes>
  );
}