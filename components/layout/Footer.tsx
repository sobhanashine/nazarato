import { FacebookIcon, InstagramIcon, LinkedInIcon, TwitterIcon } from "@/components/icons";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="follow-us">
          <h5>مارا دنبال کنید</h5>
          <div className="socials">
            <a href="#" className="soc-btn" aria-label="اینستاگرام"><InstagramIcon /></a>
            <a href="#" className="soc-btn" aria-label="توییتر"><TwitterIcon /></a>
            <a href="#" className="soc-btn" aria-label="فیسبوک"><FacebookIcon /></a>
            <a href="#" className="soc-btn" aria-label="لینکدین"><LinkedInIcon /></a>
          </div>
        </div>
        <div className="copyright">
          <p>© تمامی حقوق برای nazarato.ir محفوظ است.</p>
        </div>
      </div>
    </footer>
  );
}
