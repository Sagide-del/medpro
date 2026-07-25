// Global SaaS-style platform footer. Rendered once by the shared <Layout/>
// shell (see components/Layout.jsx) so it appears at the bottom of every
// authenticated page -- student, teacher, admin, superadmin -- without
// touching any individual page. Purely presentational: no state, no data
// fetching, no side effects.
//
// Distinct from components/shared/Footer.jsx, which is the pre-existing,
// differently-styled footer used only on the public Home page -- left
// untouched here so that page's existing look keeps working exactly as before.
export default function PlatformFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer-divider" aria-hidden="true" />
      <div className="app-footer-inner">
        <p className="app-footer-line app-footer-powered">Powered by Andolih EdTech Studios</p>
        <p className="app-footer-line app-footer-product">MedPro EMS Competency Platform</p>
        <p className="app-footer-line app-footer-tagline">Clinical Simulation • EMS Training • Digital Assessment</p>
        <p className="app-footer-line app-footer-copyright">&copy; 2026 Andolih EdTech Studios. All rights reserved.</p>
      </div>
    </footer>
  );
}
