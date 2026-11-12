import { Route, Routes } from 'react-router-dom';
import RequireAdmin from '@/components/auth/RequireAdmin';
import AdminLayout from '@/components/layout/AdminLayout';
import ComingSoon from '@/pages/ComingSoon';
import Dashboard from '@/pages/Dashboard';
import Instructors from '@/pages/Instructors';
import Login from '@/pages/Login';
import Students from '@/pages/Students';

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />

      <Route
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="instructors" element={<Instructors />} />
        <Route path="instructors/new" element={<Instructors startWithAdd />} />
        <Route path="students" element={<Students />} />
        {/* "Add Student" quick action on the dashboard opens the same page with the form already open */}
        <Route path="students/new" element={<Students startWithAdd />} />
        {/* every other sidebar item opens a placeholder until its screen is built */}
        <Route path="*" element={<ComingSoon />} />
      </Route>
    </Routes>
  );
}