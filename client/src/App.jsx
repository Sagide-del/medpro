import { REVISION_PAGES } from './data/publicSeo';
import RouteMetadata from './components/RouteMetadata';
import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import { homeForRole } from './services/auth';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Loading from './components/shared/Loading';

import Home from './pages/Home';
import RevisionLanding from './pages/RevisionLanding';
import Login from './pages/Login';
import Register from './pages/Register';

const StudentAssessments = lazy(() => import('./components/student/Assessments'));
const StudentDashboard = lazy(() => import('./components/student/Dashboard'));
const StudentProgressAnalytics = lazy(() => import('./components/student/ProgressAnalytics'));
const StudentSettings = lazy(() => import('./components/student/Settings'));
const StudentStudyPlanner = lazy(() => import('./components/student/StudyPlanner'));
const StudentSpacedRepetition = lazy(() => import('./components/student/SpacedRepetition'));
const StudentBookmarks = lazy(() => import('./components/student/Bookmarks'));
const StudentKenyaEMSHub = lazy(() => import('./components/student/KenyaEMSHub'));
const StudentMyContent = lazy(() => import('./components/student/MyContent'));
const StudentResourceLibrary = lazy(() => import('./components/student/ResourceLibrary'));
const StudentNotes = lazy(() => import('./components/student/Notes'));
const StudentLearningPaths = lazy(() => import('./components/student/LearningPaths'));
const StudentAssignments = lazy(() => import('./components/student/Assignments'));
const StudentEssays = lazy(() => import('./components/student/Essays'));
const StudentClinicalReferenceCards = lazy(() => import('./components/student/ClinicalReferenceCards'));
const StudentExamPreparation = lazy(() => import('./components/student/ExamPreparation'));
const StudentWorksheets = lazy(() => import('./components/student/Worksheets'));
const StudentFlashcards = lazy(() => import('./components/student/Flashcards'));
const StudentGraphics = lazy(() => import('./components/student/Graphics'));
const StudentLogbook = lazy(() => import('./components/student/Logbook'));
const PublishedPodcasts = lazy(() => import('./components/student/PublishedPodcasts'));
const PublishedLibrary = lazy(() => import('./components/student/PublishedLibrary'));
const StudentPayments = lazy(() => import('./components/student/Payments'));
const StudentResearch = lazy(() => import('./components/student/Research'));
const StudentSimulations = lazy(() => import('./components/student/Simulations'));
const StudentGroups = lazy(() => import('./components/student/Groups'));
const StudentProctoredExams = lazy(() => import('./components/student/ProctoredExams'));
const StudentKenyaEmsCases = lazy(() => import('./components/student/KenyaCaseCourse'));
const KenyaCaseManager = lazy(() => import('./components/superadmin/KenyaCaseManager'));
const StudentMockPreTest = lazy(() => import('./components/student/exams/mockPreTest/MockPreTestPage'));
const StudentPsychometricTest = lazy(() => import('./components/student/PsychometricTest'));
const MedProhubEmsAssignments = lazy(() => import('./components/medprohub/student/EmsAssignments'));
const MedProhubEmsPlayer = lazy(() => import('./components/medprohub/student/EmsPlayer'));

const TeacherDashboard = lazy(() => import('./components/teacher/Dashboard'));
const TeacherAssignments = lazy(() => import('./components/teacher/Assignments'));
const TeacherQuestionBank = lazy(() => import('./components/teacher/QuestionBank'));
const TeacherAiAssignmentGenerator = lazy(() => import('./components/teacher/AiAssignmentGenerator'));
const TeacherContentCustomizer = lazy(() => import('./pages/teacher/ContentCustomizer'));
const MedProhubEmsBrowser = lazy(() => import('./components/medprohub/teacher/EmsBrowser'));
const MedProhubEmsCustomizer = lazy(() => import('./components/medprohub/teacher/EmsCustomizer'));
const TeacherMarkingQueue = lazy(() => import('./components/teacher/MarkingQueue'));
const TeacherStudentPerformance = lazy(() => import('./components/teacher/StudentPerformance'));
const TeacherSimulationPerformance = lazy(() => import('./components/teacher/SimulationPerformance'));
const TeacherCreateAssessment = lazy(() => import('./components/teacher/CreateAssessment'));
const TeacherClinicalReferenceCards = lazy(() => import('./components/teacher/ClinicalReferenceCards'));
const TeacherGradeSubmissions = lazy(() => import('./components/teacher/GradeSubmissions'));
const TeacherReviewLogbook = lazy(() => import('./components/teacher/ReviewLogbook'));
const TeacherAnalytics = lazy(() => import('./components/teacher/Analytics'));
const TeacherSendAlerts = lazy(() => import('./components/teacher/SendAlerts'));
const TeacherVideoAssessments = lazy(() => import('./components/teacher/VideoAssessments'));
const TeacherProctoredExams = lazy(() => import('./components/teacher/ProctoredExams'));

const AdminClinicalReferenceCardsManager = lazy(() => import('./components/admin/ClinicalReferenceCardsManager'));
const AdminDashboard = lazy(() => import('./components/admin/Dashboard'));
const AdminInstitutions = lazy(() => import('./components/admin/Institutions'));
const AdminUsers = lazy(() => import('./components/admin/Users'));
const AdminRevenue = lazy(() => import('./components/admin/Revenue'));
const AdminClinicalRotations = lazy(() => import('./components/admin/ClinicalRotations'));
const DrugReferenceImages = lazy(() => import('./components/superadmin/DrugReferenceImages'));
const AdminContentBank = lazy(() => import('./pages/admin/ContentBank'));

const MedProhubEmsCaseGenerator = lazy(() => import('./components/medprohub/admin/EmsCaseGenerator'));

const SuperAdminDashboard = lazy(() => import('./components/superadmin/Dashboard'));
const SuperAdminInstitutions = lazy(() => import('./components/superadmin/Institutions'));
const SuperAdminContentUpload = lazy(() => import('./components/superadmin/ContentUpload'));
const SuperAdminClinicalReferenceCardsManager = lazy(() => import('./components/superadmin/ClinicalReferenceCardsManager'));
const SuperAdminRevenueAnalytics = lazy(() => import('./components/superadmin/RevenueAnalytics'));
const SuperAdminELibraryManager = lazy(() => import('./components/superadmin/ELibraryManager'));
const SuperAdminAiGenerator = lazy(() => import('./components/superadmin/AiGenerator'));
const SuperAdminUserCommunications = lazy(() => import('./components/superadmin/UserCommunications'));


const STUDENT_LINKS = [
  {
    group: 'Exam Prep',
    items: [
      { to: '/student/mcq-questions', label: 'Question Bank', icon: 'exam' },
      { to: '/student/learn/kenya-ems', label: 'Kenya EMS Cases', icon: 'cases' },
    ],
  },
  {
    group: 'Revision',
    items: [
      { to: '/student/reference-cards', label: 'Cheat Sheets', icon: 'learn' },
      { to: '/student/essays', label: 'Essays', icon: 'document' },
    ],
  },
  {
    group: 'Aliases',
    items: [
      { to: '/student/mcq-questions', label: 'MCQ Questions', icon: 'exam' },
      { to: '/student/kenya-case-studies', label: 'Kenya EMS Cases', icon: 'cases' },
      { to: '/student/case-studies', label: 'Kenya EMS Cases', icon: 'cases' },
      { to: '/student/medprohub/cases', label: 'MedProHub EMS Cases', icon: 'cases' },
      { to: '/student/research', label: 'Research', icon: 'document' },
    ],
  },
];


const TEACHER_LINKS = [
  { to: '/teacher/dashboard', label: 'Dashboard', end: true },
  { to: '/teacher/assignments', label: 'Assignments' },
  { to: '/teacher/question-bank', label: 'Question Bank' },
  { to: '/teacher/ai-generator', label: 'AI Assignment Generator' },
  { to: '/teacher/content-customizer', label: 'Content Customizer' },
  { to: '/teacher/medprohub/bank', label: 'EMS Bank' },
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
  { to: '/admin/content-bank', label: 'Content Bank' },
  { to: '/admin/institution', label: 'Institution' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/revenue', label: 'Revenue' },
];

const LECTURIO_STUDENT_LINKS = [
  { group: 'Home', items: [{ to: '/student/dashboard', label: 'Dashboard', end: true, icon: 'dashboard' }] },
  { group: 'Revision', items: [
    { to: '/student/question-bank', label: 'Question Bank', icon: 'exam' },
    { to: '/student/mock-prep-tests', label: 'Psychometric Test', icon: 'practice' },
    { to: '/student/study-planner', label: 'Study Plans', icon: 'calendar' },
    { to: '/student/learn/kenya-ems', label: 'Kenya EMS Cases', icon: 'cases' },
  ] },
  { group: 'Progress', items: [
    { to: '/student/progress-analytics', label: 'Performance', icon: 'progress' },
  ] },
  { group: 'Resources', items: [
    { to: '/student/my-content', label: 'Resources', icon: 'learn', end: true },
    { to: '/student/study-guides', label: 'Study Guides', icon: 'learn', nested: true },
    { to: '/student/drug-reference', label: 'Drug Reference', icon: 'pill', nested: true },
    { to: '/student/videos', label: 'Podcasts', icon: 'activity', nested: true },
    { to: '/student/cheat-sheets', label: 'Cheat Sheets', icon: 'learn', nested: true },
  ] },
  { group: 'Account', items: [{ to: '/student/settings', label: 'Settings', icon: 'settings' }] },
];

// New study navigation is the default; set VITE_LECTURIO_NAV_ENABLED=false only to roll back.
const lecturioNavEnabled = import.meta.env.VITE_LECTURIO_NAV_ENABLED !== 'false';
const typographyV2Enabled = import.meta.env.VITE_TYPOGRAPHY_V2_ENABLED !== 'false';


const SUPERADMIN_LINKS = [
  {
    group: "Main",
    items: [
      {
        to: '/superadmin/dashboard',
        label: 'Dashboard',
        end: true,
        icon: 'dashboard',
      },
    ],
  },

  {
    group: "Management",
    items: [
      {
        to: '/superadmin/institutions',
        label: 'Institutions',
        icon: 'dashboard',
      },
      {
        to: '/superadmin/users',
        label: 'Users',
        icon: 'shield',
      },
      {
        to: '/superadmin/communications',
        label: 'Communication Center',
        icon: 'mail',
      },
    ],
  },

  {
    group: "Content Management",
    items: [
      {
        to: '/superadmin/content',
        label: 'Content Studio',
        icon: 'document',
      },
      {
        to: '/superadmin/elibrary',
        label: 'E-Library',
      },
      {
        to: '/superadmin/reference-cards',
        label: 'Clinical Reference Cards',
      },
      {
        to: '/superadmin/kenya-ems-cases',
        label: 'Kenya EMS Cases',
        icon: 'cases',
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


function RequireRole({ role, roles, children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const allowedRoles = Array.isArray(roles) && roles.length > 0
    ? roles
    : role
      ? [role]
      : [];

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  return children;
}

function RequireStudentSubscription({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const [state, setState] = useState({ loading: user?.role === 'student', allowed: false });
  const [retry,setRetry]=useState(0);

  useEffect(() => {
    let ignore = false;

    if (user?.role !== 'student') {
      setState({ loading: false, allowed: true });
      return () => {};
    }

    setState({loading:true,allowed:false});
    api('/subscriptions/student/current')
      .then((data) => {
        if (!ignore) setState({ loading: false, allowed: !!data.subscription?.allowed });
      })
      .catch(error => {
        if (!ignore) setState({ loading: false, allowed: false, error:error.message });
      });

    return () => {
      ignore = true;
    };
  }, [user?.role, user?.id, retry]);

  if (user?.role !== 'student') return children;
  if (state.loading) return <Loading label="Checking subscription..." />;
  if(state.error)return <main className="auth-wrap"><section className="card"><h1>Unable to check access</h1><p role="alert">{state.error}</p><button type="button" onClick={()=>setRetry(value=>value+1)}>Try again</button></section></main>;

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
        <Route path="/emt-revision" element={<RevisionLanding page={REVISION_PAGES[0]} />} />
        <Route path="/paramedic-revision" element={<RevisionLanding page={REVISION_PAGES[1]} />} />
        <Route path="/nursing-revision" element={<RevisionLanding page={REVISION_PAGES[2]} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />


        <Route element={<RequireRole role="student"><RequireStudentSubscription><Layout links={lecturioNavEnabled ? LECTURIO_STUDENT_LINKS : STUDENT_LINKS} roleLabel="" /></RequireStudentSubscription></RequireRole>}>
          <Route path="/student" element={<Navigate to={lecturioNavEnabled ? '/student/dashboard' : '/student/mcq-questions'} replace />} />
          <Route path="/student/study-planner" element={<StudentStudyPlanner />} />
          <Route path="/student/my-content" element={<StudentMyContent />} />
          <Route path="/student/study-guides" element={<StudentResourceLibrary kind="guides" />} />
          <Route path="/student/drug-reference" element={<StudentResourceLibrary kind="drugs" />} />
          <Route path="/student/clinical-protocols" element={<Navigate to="/student/study-guides" replace />} />
          <Route path="/student/notes" element={<StudentNotes />} />
          <Route path="/student/learning-paths" element={<StudentLearningPaths />} />
          <Route path="/student/learning-paths/:id" element={<StudentLearningPaths />} />
          <Route path="/student/learning-paths/:id/topic/:topic" element={<StudentLearningPaths />} />
          <Route path="/student/spaced-repetition" element={<StudentSpacedRepetition />} />
          <Route path="/student/bookmarks" element={<StudentBookmarks />} />
          <Route path="/student/kenya-ems-hub" element={<StudentKenyaEMSHub />} />
          <Route path="/student/clinical-cases" element={<Navigate to="/student/mock-prep-tests" replace />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/settings" element={<StudentSettings />} />
          <Route path="/student/exam-preparation" element={<StudentExamPreparation />} />
          <Route path="/student/exam-center" element={<StudentExamPreparation />} />
          <Route path="/student/clinical-library" element={<StudentClinicalReferenceCards />} />
          <Route path="/student/learn/kenya-ems" element={<StudentKenyaEmsCases />} />
          <Route path="/student/published-cases" element={<Navigate to="/student/learn/kenya-ems" replace />} />
          <Route path="/student/learn/kenya-ems/:caseNumber" element={<StudentKenyaEmsCases />} />
          <Route path="/student/medprohub/cases" element={<MedProhubEmsAssignments />} />
          <Route path="/student/medprohub/cases/:id" element={<MedProhubEmsPlayer />} />
          {/* Old case_studies-UUID-based paths from the previous architecture --
              kept as redirects to the new case-number dashboard so old
              bookmarks/links don't dead-end. Deep-linking straight to a specific
              case isn't preservable (the old path carried a database UUID, the
              new one carries a plain case number), so these all land on the
              dashboard rather than guessing a mapping. */}
          <Route path="/student/kenya-ems-cases" element={<Navigate to="/student/learn/kenya-ems" replace />} />
          <Route path="/student/kenya-ems-cases/:id" element={<Navigate to="/student/learn/kenya-ems" replace />} />
          <Route path="/student/kenya-case-studies" element={<Navigate to="/student/learn/kenya-ems" replace />} />
          <Route path="/student/kenya-case-studies/:id" element={<Navigate to="/student/learn/kenya-ems" replace />} />
          <Route path="/student/case-studies" element={<Navigate to="/student/learn/kenya-ems" replace />} />
          <Route path="/student/case-studies/:id" element={<Navigate to="/student/learn/kenya-ems" replace />} />
          <Route path="/student/mcq-questions" element={<StudentAssessments />} />
          <Route path="/student/mcq-questions/:id" element={<StudentAssessments />} />
          <Route path="/student/mcq/mock-pretest" element={<StudentMockPreTest />} />
          <Route path="/student/mock-prep-tests" element={<StudentPsychometricTest />} />
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
          <Route path="/student/essays" element={<StudentEssays />} />
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
          <Route path="/student/videos" element={<PublishedPodcasts />} />
          <Route path="/student/skills-videos" element={<Navigate to="/student/study-guides" replace />} />
          <Route path="/student/mnemonics" element={<PublishedLibrary destination="mnemonics" title="Mnemonics" />} />
          <Route path="/student/published-flashcards" element={<PublishedLibrary destination="flashcards" title="Flashcards" />} />
          <Route path="/student/published-diagrams" element={<PublishedLibrary destination="diagrams" title="Images & Diagrams" />} />
          <Route path="/student/cheat-sheets" element={<StudentResourceLibrary kind="sheets" />} />
          <Route path="/student/community" element={<StudentGroups />} />
          <Route path="/student/groups" element={<Navigate to="/student/mcq-questions" replace />} />
          <Route path="/student/subscription" element={<StudentPayments />} />
          <Route path="/student/payments" element={<StudentPayments />} />
          <Route path="/student/simulations" element={<StudentSimulations />} />
          <Route path="/student/proctored-exams" element={<StudentProctoredExams />} />
          <Route path="/student/elibrary" element={<Navigate to="/student/mcq-questions" replace />} />
          <Route path="/student/elibrary/:id" element={<Navigate to="/student/mcq-questions" replace />} />
          <Route path="/student/research" element={<StudentResearch />} />
          <Route path="/student/research/:id" element={<StudentResearch />} />
        </Route>


        <Route element={<RequireRole role="teacher"><Layout links={TEACHER_LINKS} roleLabel="Teacher portal" /></RequireRole>}>
          <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/assignments" element={<TeacherAssignments />} />
          <Route path="/teacher/question-bank" element={<TeacherQuestionBank />} />
          <Route path="/teacher/ai-generator" element={<TeacherAiAssignmentGenerator />} />
          <Route path="/teacher/content-customizer" element={<TeacherContentCustomizer />} />
          <Route path="/teacher/medprohub/bank" element={<MedProhubEmsBrowser />} />
          <Route path="/teacher/medprohub/customize/:id" element={<MedProhubEmsCustomizer />} />
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


        <Route element={<RequireRole roles={['institution_admin', 'super_admin']}><Layout links={ADMIN_LINKS} roleLabel="Institution admin" /></RequireRole>}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/reference-cards" element={<AdminClinicalReferenceCardsManager />} />
          <Route path="/admin/content-bank" element={<AdminContentBank />} />
          <Route path="/admin/kenya-ems-cases" element={<RequireRole role="super_admin"><Navigate to="/superadmin/kenya-ems-cases" replace /></RequireRole>} />
          <Route path="/admin/institution" element={<AdminInstitutions />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/revenue" element={<AdminRevenue />} />
          <Route path="/admin/clinical-rotations" element={<AdminClinicalRotations />} />
        </Route>


        <Route element={<RequireRole role="super_admin"><Layout links={SUPERADMIN_LINKS} roleLabel="Super admin console" /></RequireRole>}>

          <Route path="/superadmin" element={<Navigate to="/superadmin/dashboard" replace />} />
          <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/institutions" element={<SuperAdminInstitutions />} />
          <Route path="/superadmin/users" element={<SuperAdminUserCommunications defaultTab="users" />} />
          <Route path="/superadmin/communications" element={<SuperAdminUserCommunications defaultTab="communications" />} />
          <Route path="/superadmin/kenya-ems-cases" element={<KenyaCaseManager />} />
          <Route path="/superadmin/drug-reference-images" element={<DrugReferenceImages />} />
          <Route path="/superadmin/content" element={<SuperAdminContentUpload />} />
          <Route path="/superadmin/ai-generator" element={<SuperAdminAiGenerator />} />
          <Route path="/superadmin/medprohub/generator" element={<MedProhubEmsCaseGenerator />} />
          <Route path="/superadmin/medprohub/bank" element={<Navigate to="/superadmin/kenya-ems-cases" replace />} />
          <Route path="/superadmin/elibrary" element={<SuperAdminELibraryManager />} />
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
      <div className={typographyV2Enabled ? 'typography-v2' : ''}>
        <BrowserRouter>
          <RouteMetadata />
          <Suspense fallback={<Loading />}><AppRoutes /></Suspense>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}
