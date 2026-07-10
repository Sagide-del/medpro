import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { homeForRole } from './services/auth';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

import StudentDashboard from './components/student/Dashboard';
import StudentAssessments from './components/student/Assessments';
import StudentWorksheets from './components/student/Worksheets';
import StudentFlashcards from './components/student/Flashcards';
import StudentGraphics from './components/student/Graphics';
import StudentLogbook from './components/student/Logbook';
import StudentVideos from './components/student/Videos';
import StudentGroups from './components/student/Groups';
import StudentPayments from './components/student/Payments';
import StudentELibrary from './components/student/ELibrary';
import StudentResearch from './components/student/Research';
import StudentSimulations from './components/student/Simulations';

import TeacherDashboard from './components/teacher/Dashboard';
import TeacherCreateAssessment from './components/teacher/CreateAssessment';
import TeacherGradeSubmissions from './components/teacher/GradeSubmissions';
import TeacherReviewLogbook from './components/teacher/ReviewLogbook';
import TeacherAnalytics from './components/teacher/Analytics';
import TeacherSendAlerts from './components/teacher/SendAlerts';

import AdminDashboard from './components/admin/Dashboard';
import AdminInstitutions from './components/admin/Institutions';
import AdminUsers from './components/admin/Users';
import AdminRevenue from './components/admin/Revenue';

import SuperAdminDashboard from './components/superadmin/Dashboard';
import SuperAdminInstitutions from './components/superadmin/Institutions';
import SuperAdminContentUpload from './components/superadmin/ContentUpload';
import SuperAdminFlashcardsManager from './components/superadmin/FlashcardsManager';
import SuperAdminWorksheetsManager from './components/superadmin/WorksheetsManager';
import SuperAdminGraphicsManager from './components/superadmin/GraphicsManager';
import SuperAdminRevenueAnalytics from './components/superadmin/RevenueAnalytics';

const STUDENT_LINKS = [
  { to: '/student', label: 'Dashboard', end: true },
  { to: '/student/assessments', label: 'Assessments' },
  { to: '/student/simulations', label: 'Simulations' },
  { to: '/student/worksheets', label: 'Worksheets' },
  { to: '/student/flashcards', label: 'Flashcards' },
  { to: '/student/graphics', label: 'Graphics' },
  { to: '/student/elibrary', label: 'E-Library' },
  { to: '/student/research', label: 'Research' },
  { to: '/student/logbook', label: 'Logbook' },
  { to: '/student/videos', label: 'Videos' },
  { to: '/student/groups', label: 'Groups' },
  { to: '/student/payments', label: 'Payments' },
];

const TEACHER_LINKS = [
  { to: '/teacher', label: 'Dashboard', end: true },
  { to: '/teacher/create-assessment', label: 'Create assessment' },
  { to: '/teacher/grade-submissions', label: 'Grade submissions' },
  { to: '/teacher/review-logbook', label: 'Review submissions' },
  { to: '/teacher/send-alerts', label: 'Send alerts' },
  { to: '/teacher/analytics', label: 'Class analytics' },
];

const ADMIN_LINKS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/institution', label: 'Institution' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/revenue', label: 'Revenue' },
];

const SUPERADMIN_LINKS = [
  { to: '/superadmin', label: 'Dashboard', end: true },
  { to: '/superadmin/institutions', label: 'Institutions' },
  { to: '/superadmin/users', label: 'Users' },
  { to: '/superadmin/content', label: 'Upload content' },
  { to: '/superadmin/flashcards', label: 'Flashcard decks' },
  { to: '/superadmin/worksheets', label: 'Worksheets' },
  { to: '/superadmin/graphics', label: 'Graphics' },
  { to: '/superadmin/revenue', label: 'Revenue analytics' },
];

// Blocks any user whose role doesn't match, and bounces them to THEIR OWN
// dashboard rather than the public home page — a student hitting /superadmin
// never even briefly sees a generic screen, they land back where they belong.
// Home, Login, and Register stay reachable at all times (even while signed
// in) so you can always get back to them to sign in as a different role.
function RequireRole({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={homeForRole(user.role)} replace />;
  return children;
}

// Top-level safety net: also catches crashes on Home/Login/Register, which
// sit outside Layout's own boundary. Keyed on the route so a crash on one
// page doesn't linger once you've navigated elsewhere.
function AppRoutes() {
  const location = useLocation();
  return (
    <ErrorBoundary key={location.pathname}>
      <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student portal */}
          <Route element={<RequireRole role="student"><Layout links={STUDENT_LINKS} roleLabel="Student portal" /></RequireRole>}>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/assessments" element={<StudentAssessments />} />
            <Route path="/student/assessments/:id" element={<StudentAssessments />} />
            <Route path="/student/worksheets" element={<StudentWorksheets />} />
            <Route path="/student/worksheets/:id" element={<StudentWorksheets />} />
            <Route path="/student/flashcards" element={<StudentFlashcards />} />
            <Route path="/student/flashcards/:id" element={<StudentFlashcards />} />
            <Route path="/student/graphics" element={<StudentGraphics />} />
            <Route path="/student/graphics/:id" element={<StudentGraphics />} />
            <Route path="/student/logbook" element={<StudentLogbook />} />
            <Route path="/student/videos" element={<StudentVideos />} />
            <Route path="/student/groups" element={<StudentGroups />} />
            <Route path="/student/payments" element={<StudentPayments />} />
            <Route path="/student/simulations" element={<StudentSimulations />} />
            <Route path="/student/elibrary" element={<StudentELibrary />} />
            <Route path="/student/elibrary/:id" element={<StudentELibrary />} />
            <Route path="/student/research" element={<StudentResearch />} />
            <Route path="/student/research/:id" element={<StudentResearch />} />
          </Route>

          {/* Teacher portal */}
          <Route element={<RequireRole role="teacher"><Layout links={TEACHER_LINKS} roleLabel="Teacher portal" /></RequireRole>}>
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/create-assessment" element={<TeacherCreateAssessment />} />
            <Route path="/teacher/grade-submissions" element={<TeacherGradeSubmissions />} />
            <Route path="/teacher/review-logbook" element={<TeacherReviewLogbook />} />
            <Route path="/teacher/send-alerts" element={<TeacherSendAlerts />} />
            <Route path="/teacher/analytics" element={<TeacherAnalytics />} />
          </Route>

          {/* Institution admin portal */}
          <Route element={<RequireRole role="institution_admin"><Layout links={ADMIN_LINKS} roleLabel="Institution admin" /></RequireRole>}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/institution" element={<AdminInstitutions />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/revenue" element={<AdminRevenue />} />
          </Route>

          {/* Super admin console */}
          <Route element={<RequireRole role="super_admin"><Layout links={SUPERADMIN_LINKS} roleLabel="Super admin console" /></RequireRole>}>
            <Route path="/superadmin" element={<SuperAdminDashboard />} />
            <Route path="/superadmin/institutions" element={<SuperAdminInstitutions />} />
            <Route path="/superadmin/users" element={<AdminUsers />} />
            <Route path="/superadmin/content" element={<SuperAdminContentUpload />} />
            <Route path="/superadmin/flashcards" element={<SuperAdminFlashcardsManager />} />
            <Route path="/superadmin/worksheets" element={<SuperAdminWorksheetsManager />} />
            <Route path="/superadmin/graphics" element={<SuperAdminGraphicsManager />} />
            <Route path="/superadmin/revenue" element={<SuperAdminRevenueAnalytics />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
