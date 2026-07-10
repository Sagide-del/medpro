export default function Footer() {
  return (
    <footer className="footer">
      MedPro &middot; developed by SA Technologies<br />
      South C (Bellevue), Red Cross Road, Nairobi &middot; +254 748 519 923 &middot;{' '}
      <a href="mailto:info@satechnologies.co.ke">info@satechnologies.co.ke</a>
      <div style={{ marginTop: 6 }}>&copy; {new Date().getFullYear()} MedPro. All rights reserved.</div>
    </footer>
  );
}
