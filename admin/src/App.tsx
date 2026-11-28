import { Route, Routes } from 'react-router-dom';
import RequireAdmin from '@/components/auth/RequireAdmin';
import RequirePermission from '@/components/auth/RequirePermission';
import AdminLayout from '@/components/layout/AdminLayout';
import AdminsRoles from '@/pages/AdminsRoles';
import ComingSoon from '@/pages/ComingSoon';
import Courses from '@/pages/Courses';
import Dashboard from '@/pages/Dashboard';
import Instructors from '@/pages/Instructors';
import LiveClasses from '@/pages/LiveClasses';
import LiveRoomHost from '@/pages/LiveRoomHost';
import Login from '@/pages/Login';
import ModulesLessons from '@/pages/ModulesLessons';
import AssignmentSubmissions from '@/pages/AssignmentSubmissions';
import QuizBuilder from '@/pages/QuizBuilder';
import QuizResults from '@/pages/QuizResults';
import QuizzesAssignments from '@/pages/QuizzesAssignments';
import Students from '@/pages/Students';

type GuardProps = Parameters<typeof RequirePermission>[0];
const Guard = (props: GuardProps) => <RequirePermission {...props} />;

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />

      {/* the teaching room fills the whole screen, so it sits outside the panel layout */}
      <Route
        path="live-classes/:id/room"
        element={
          <RequireAdmin>
            <Guard module="liveClasses" level="edit">
              <LiveRoomHost />
            </Guard>
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
        <Route path="courses" element={<Guard module="courses"><Courses /></Guard>} />
        <Route path="courses/new" element={<Guard module="courses" level="edit"><Courses startWithAdd /></Guard>} />
        <Route path="instructors" element={<Guard module="instructors"><Instructors /></Guard>} />
        <Route path="instructors/new" element={<Guard module="instructors" level="edit"><Instructors startWithAdd /></Guard>} />
        <Route path="students" element={<Guard module="students"><Students /></Guard>} />
        {/* "Add Student" quick action on the dashboard opens the same page with the form already open */}
        <Route path="students/new" element={<Guard module="students" level="edit"><Students startWithAdd /></Guard>} />
        <Route path="live-classes" element={<Guard module="liveClasses"><LiveClasses /></Guard>} />
        <Route path="modules-lessons" element={<Guard module="curriculum"><ModulesLessons /></Guard>} />
        <Route path="modules-lessons/:slug" element={<Guard module="curriculum"><ModulesLessons /></Guard>} />
        <Route path="quizzes-assignments" element={<Guard module="assessments"><QuizzesAssignments /></Guard>} />
        <Route path="quizzes-assignments/quiz/:id" element={<Guard module="assessments"><QuizBuilder /></Guard>} />
        <Route path="quizzes-assignments/quiz/:id/results" element={<Guard module="assessments"><QuizResults /></Guard>} />
        <Route path="quizzes-assignments/assignment/:id" element={<Guard module="assessments"><AssignmentSubmissions /></Guard>} />
        {/* only the super admin: add / remove admins, choose what each may do, watch what they do */}
        <Route path="admins-roles" element={<RequirePermission superOnly><AdminsRoles /></RequirePermission>} />
        {/* every other sidebar item opens a placeholder until its screen is built */}
        <Route path="*" element={<ComingSoon />} />
      </Route>
    </Routes>
  );
}