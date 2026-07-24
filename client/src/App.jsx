import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import { homeForRole } from './services/auth';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Loading from './components/shared/Loading';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

import StudentDashboard from './components/student/Dashboard';
import StudentAssessments from './components/student/Assessments';
import StudentAssignments from './components/student/Assignments';
import StudentClinicalReferenceCards from './components/student/ClinicalReferenceCards';
import StudentExamPreparation from './components/student/ExamPreparation';
import StudentWorksheets from './components/student/Worksheets';
import StudentFlashcards from './components/student/Flashcards';
import StudentGraphics from './components/student/Graphics';
import StudentLogbook from './components/student/Logbook';
import StudentVideos from './components/student/Videos';
import StudentGroups from './components/student/Groups';
import StudentPayments from './components/student/Payments';
import StudentELibrary from './components/student/ELibrary';
import StudentProgressAnalytics from './components/student/ProgressAnalytics';
import StudentResearch from './components/student/Research';
import StudentSimulations from './components/student/Simulations';
import StudentProctoredExams from './components/student/ProctoredExams';

import TeacherDashboard from './components/teacher/Dashboard';
import TeacherAssignments from './components/teacher/Assignments';
import TeacherQuestionBank from './components/teacher/QuestionBank';
import TeacherAiAssignmentGenerator from './components/teacher/AiAssignmentGenerator';
import TeacherMarkingQueue from './components/teacher/MarkingQueue';
import TeacherStudentPerformance from './components/teacher/StudentPerformance';
import TeacherSimulationPerformance from './components/teacher/SimulationPerformance';
import TeacherCreateAssessment from './components/teacher/CreateAssessment';
import TeacherClinicalReferenceCards from './components/teacher/ClinicalReferenceCards';
import TeacherGradeSubmissions from './components/teacher/GradeSubmissions';
import TeacherReviewLogbook from './components/teacher/ReviewLogbook';
import TeacherAnalytics from './components/teacher/Analytics';
import TeacherSendAlerts from './components/teacher/SendAlerts';
import TeacherVideoAssessments from './components/teacher/VideoAssessments';
import TeacherProctoredExams from './components/teacher/ProctoredExams';

import AdminClinicalReferenceCardsManager from './components/admin/ClinicalReferenceCardsManager';
import AdminDashboard from './components/admin/Dashboard';
import AdminInstitutions from './components/admin/Institutions';
import AdminUsers from './components/admin/Users';
import AdminRevenue from './components/admin/Revenue';
import AdminClinicalRotations from './components/admin/ClinicalRotations';

import SuperAdminDashboard from './components/superadmin/Dashboard';
import SuperAdminInstitutions from './components/superadmin/Institutions';
import SuperAdminContentUpload from './components/superadmin/ContentUpload';
import SuperAdminFlashcardsManager from './components/superadmin/FlashcardsManager';
import SuperAdminWorksheetsManager from './components/superadmin/WorksheetsManager';
import SuperAdminGraphicsManager from './components/superadmin/GraphicsManager';
import SuperAdminClinicalReferenceCardsManager from './components/superadmin/ClinicalReferenceCardsManager';
import SuperAdminRevenueAnalytics from './components/superadmin/RevenueAnalytics';
import SuperAdminELibraryManager from './components/superadmin/ELibraryManager';


const STUDENT_LINKS = [
  {
    group: 'Dashboard',
    items: [
      { to: '/student/dashboard', label: 'Dashboard', end: true },
      { to: '/student/subscription', label: 'Subscription' },
    ],
  },
  {
    group: 'Learn',
    items: [
      { to: '/student/exam-center', label: 'Exam Center' },
      { to: '/student/assignments', label: 'Assignments' },
      { to: '/student/simulations', label: 'Skill Simulations' },
    ],
  },
  {
    group: 'Practice',
    items: [
      { to: '/student/logbook', label: 'Clinical Logbook' },
      { to: '/student/videos', label: 'Video Practicals' },
    ],
  },
  {
    group: 'Progress',
    items: [
      { to: '/student/progress-analytics', label: 'Analytics' },
    ],
  },
  {
    group: 'Community',
    items: [
      { to: '/student/community', label: 'My Study Group' },
      { to: '/student/elibrary', label: 'E-Library' },
    ],
  },
  {
    group: 'Aliases',
    items: [
      { to: '/student/mcq-questions', label: 'MCQ Questions' },
      { to: '/student/mock-prep-tests', label: 'Mock Prep Tests' },
      { to: '/student/reference-cards', label: 'Clinical Reference Cards' },
      { to: '/student/research', label: 'Research' },
    ],
  },
];


const TEACHER_LINKS = [
  { to: '/teacher/dashboard', label: 'Dashboard', end: true },
  { to: '/teacher/assignments', label: 'Assignments' },
  { to: '/teacher/question-bank', label: 'Question Bank' },
  { to: '/teacher/ai-generator', label: 'AI Assignment Generator' },
  { to: '/teacher/marking-queue', label: 'Marking Queue' },
  { to: '/teacher/student-performance', label: 'Student Performance' },
  { to: '/teacher/simulation-performance', label: 'Simulation Performance' },
  { to: '/teacher/create-assessment', label: 'Create assessment' },
  { to: '/teacher/reference-cards', label: 'Clinical Reference Cards' },
  { to: '/teacher/grade-submissions', label: 'Grade submissions' },
  { to: '/teacher/review-logbook', label: 'Review submissions' },
  { to: '/teacher/send-alerts', label: 'Send alerts' },
  { to: '/teacher/analytics', label: 'Class analytics' },
];


const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', end: true },
  { to: '/admin/reference-cards', label: 'Clinical Reference Cards' },
  { to: '/admin/institution', label: 'Institution' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/revenue', label: 'Revenue' },
];


const SUPERADMIN_LINKS = [
  {
    group: "Main",
    items: [
      {
        to: '/superadmin/dashboard',
        label: 'Dashboard',
        end: true,
      },
    ],
  },

  {
    group: "Management",
    items: [
      {
        to: '/superadmin/institutions',
        label: 'Institutions',
      },
      {
        to: '/superadmin/users',
        label: 'Users',
      },
    ],
  },

  {
    group: "Content Management",
    items: [
      {
        to: '/superadmin/content',
        label: 'Upload Content',
      },
      {
        to: '/superadmin/elibrary',
        label: 'E-Library',
      },
      {
        to: '/superadmin/flashcards',
        label: 'Flashcard Decks',
      },
      {
        to: '/superadmin/worksheets',
        label: 'Worksheets',
      },
      {
        to: '/superadmin/graphics',
        label: 'Graphics',
      },
      {
        to: '/superadmin/reference-cards',
        label: 'Clinical Reference Cards',
      },
    ],
  },

  {
    group: "Finance",
    items: [
      {
        to: '/superadmin/revenue',
        label: 'Revenue Analytics',
      },
    ],
  },
];


function RequireRole({ role, children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (user.role !== role) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  return children;
}

function RequireStudentSubscription({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const [state, setState] = useState({ loading: user?.role === 'student', allowed: false });

  useEffect(() => {
    let ignore = false;

    if (user?.role !== 'student') {
      setState({ loading: false, allowed: true });
      return () => {};
    }

    api('/subscriptions/student/current')
      .then((data) => {
        if (!ignore) setState({ loading: false, allowed: !!data.subscription?.allowed });
      })
      .catch(() => {
        if (!ignore) setState({ loading: false, allowed: false });
      });

    return () => {
      ignore = true;
    };
  }, [user?.role, user?.sub]);

  if (user?.role !== 'student') return children;
  if (state.loading) return <Loading label="Checking subscription..." />;

  const allowedPaths = ['/student/subscription', '/student/payments'];
  if (!state.allowed && !allowedPaths.includes(location.pathname)) {
    return <Navigate to="/student/subscription" replace state={{ from: location.pathname }} />;
  }

  return children;
}


function AppRoutes() {
  const location = useLocation();

  return (
    <ErrorBoundary key={location.pathname}>
      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />


        <Route element={<RequireRole role="student"><RequireStudentSubscription><Layout links={STUDENT_LINKS} roleLabel="EMS competency dashboard" /></RequireStudentSubscription></RequireRole>}>
          <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/exam-preparation" element={<StudentExamPreparation />} />
          <Route path="/student/exam-center" element={<StudentExamPreparation />} />
          <Route path="/student/clinical-library" element={<StudentClinicalReferenceCards />} />
          <Route path="/student/mcq-questions" element={<StudentAssessments />} />
          <Route path="/student/mcq-questions/:id" element={<StudentAssessments />} />
          <Route path="/student/mock-prep-tests" element={<StudentAssessments />} />
          <Route path="/student/mock-prep-tests/:id" element={<StudentAssessments />} />
          <Route path="/student/question-bank" element={<StudentAssessments />} />
          <Route path="/student/question-bank/:id" element={<StudentAssessments />} />
          <Route path="/student/mock-exams" element={<StudentAssessments />} />
          <Route path="/student/mock-exams/:id" element={<StudentAssessments />} />
          <Route path="/student/cats" element={<StudentAssessments />} />
          <Route path="/student/cats/:id" element={<StudentAssessments />} />
          <Route path="/student/assessments" element={<StudentAssessments />} />
          <Route path="/student/assessments/:id" element={<StudentAssessments />} />
          <Route path="/student/assignments" element={<StudentAssignments />} />
          <Route path="/student/assignments/:id" element={<StudentAssignments />} />
          <Route path="/student/worksheets" element={<StudentWorksheets />} />
          <Route path="/student/worksheets/:id" element={<StudentWorksheets />} />
          <Route path="/student/flashcards" element={<StudentFlashcards />} />
          <Route path="/student/flashcards/:id" element={<StudentFlashcards />} />
          <Route path="/student/reference-cards" element={<StudentClinicalReferenceCards />} />
          <Route path="/student/reference-cards/:id" element={<StudentClinicalReferenceCards />} />
          <Route path="/student/graphics" element={<StudentGraphics />} />
          <Route path="/student/graphics/:id" element={<StudentGraphics />} />
          <Route path="/student/progress-analytics" element={<StudentProgressAnalytics />} />
          <Route path="/student/logbook" element={<StudentLogbook />} />
          <Route path="/student/videos" element={<StudentVideos />} />
          <Route path="/student/community" element={<StudentGroups />} />
          <Route path="/student/groups" element={<StudentGroups />} />
          <Route path="/student/subscription" element={<StudentPayments />} />
          <Route path="/student/payments" element={<StudentPayments />} />
          <Route path="/student/simulations" element={<StudentSimulations />} />
          <Route path="/student/proctored-exams" element={<StudentProctoredExams />} />
          <Route path="/student/elibrary" element={<StudentELibrary />} />
          <Route path="/student/elibrary/:id" element={<StudentELibrary />} />
          <Route path="/student/research" element={<StudentResearch />} />
          <Route path="/student/research/:id" element={<StudentResearch />} />
        </Route>


        <Route element={<RequireRole role="teacher"><Layout links={TEACHER_LINKS} roleLabel="Teacher portal" /></RequireRole>}>
          <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/assignments" element={<TeacherAssignments />} />
          <Route path="/teacher/question-bank" element={<TeacherQuestionBank />} />
          <Route path="/teacher/ai-generator" element={<TeacherAiAssignmentGenerator />} />
          <Route path="/teacher/marking-queue" element={<TeacherMarkingQueue />} />
          <Route path="/teacher/student-performance" element={<TeacherStudentPerformance />} />
          <Route path="/teacher/simulation-performance" element={<TeacherSimulationPerformance />} />
          <Route path="/teacher/create-assessment" element={<TeacherCreateAssessment />} />
          <Route path="/teacher/reference-cards" element={<TeacherClinicalReferenceCards />} />
          <Route path="/teacher/reference-cards/:id" element={<TeacherClinicalReferenceCards />} />
          <Route path="/teacher/grade-submissions" element={<TeacherGradeSubmissions />} />
          <Route path="/teacher/review-logbook" element={<TeacherReviewLogbook />} />
          <Route path="/teacher/send-alerts" element={<TeacherSendAlerts />} />
          <Route path="/teacher/analytics" element={<TeacherAnalytics />} />
          <Route path="/teacher/video-assessments" element={<TeacherVideoAssessments />} />
          <Route path="/teacher/proctored-exams" element={<TeacherProctoredExams />} />
        </Route>


        <Route element={<RequireRole role="institution_admin"><Layout links={ADMIN_LINKS} roleLabel="Institution admin" /></RequireRole>}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/reference-cards" element={<AdminClinicalReferenceCardsManager />} />
          <Route path="/admin/institution" element={<AdminInstitutions />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/revenue" element={<AdminRevenue />} />
          <Route path="/admin/clinical-rotations" element={<AdminClinicalRotations />} />
        </Route>


        <Route element={<RequireRole role="super_admin"><Layout links={SUPERADMIN_LINKS} roleLabel="Super admin console" /></RequireRole>}>

          <Route path="/superadmin" element={<Navigate to="/superadmin/dashboard" replace />} />
          <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/institutions" element={<SuperAdminInstitutions />} />
          <Route path="/superadmin/users" element={<AdminUsers />} />
          <Route path="/superadmin/content" element={<SuperAdminContentUpload />} />
          <Route path="/superadmin/elibrary" element={<SuperAdminELibraryManager />} />
          <Route path="/superadmin/flashcards" element={<SuperAdminFlashcardsManager />} />
          <Route path="/superadmin/worksheets" element={<SuperAdminWorksheetsManager />} />
          <Route path="/superadmin/graphics" element={<SuperAdminGraphicsManager />} />
          <Route path="/superadmin/reference-cards" element={<SuperAdminClinicalReferenceCardsManager />} />
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
