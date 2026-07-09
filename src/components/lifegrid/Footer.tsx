import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer id="contact" className="mt-16 bg-bg-secondary border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid gap-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white heartbeat">
              <i className="fa-solid fa-heart-pulse" />
            </span>
            <span className="font-display text-xl font-bold text-foreground">LifeGrid</span>
          </div>
          <p className="text-sm text-text-secondary">
            Real-time hospital bed availability across India. Find and book the right bed, right when you need it.
          </p>
          <div className="flex gap-3 mt-4 text-text-secondary">
            <a href="#" aria-label="Facebook" className="hover:text-primary"><i className="fa-brands fa-facebook" /></a>
            <a href="#" aria-label="Twitter" className="hover:text-primary"><i className="fa-brands fa-x-twitter" /></a>
            <a href="#" aria-label="Instagram" className="hover:text-primary"><i className="fa-brands fa-instagram" /></a>
            <a href="#" aria-label="LinkedIn" className="hover:text-primary"><i className="fa-brands fa-linkedin" /></a>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground mb-3">Company</h4>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li><a href="#" className="hover:text-primary">About</a></li>
            <li><a href="#" className="hover:text-primary">Careers</a></li>
            <li><a href="#" className="hover:text-primary">Press</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground mb-3">Support</h4>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li><a href="#" className="hover:text-primary">Help center</a></li>
            <li><a href="#" className="hover:text-primary">Contact us</a></li>
            <li><a href="#" className="hover:text-primary">Partner hospitals</a></li>

          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground mb-3">Legal</h4>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li><a href="#" className="hover:text-primary">Terms</a></li>
            <li><a href="#" className="hover:text-primary">Privacy</a></li>
            <li><a href="#" className="hover:text-primary">Cookies</a></li>
          </ul>
          <div className="mt-4 flex gap-2">
            <span className="px-3 py-2 rounded-md border border-border text-xs text-text-secondary flex items-center gap-1"><i className="fa-brands fa-apple" /> App Store</span>
            <span className="px-3 py-2 rounded-md border border-border text-xs text-text-secondary flex items-center gap-1"><i className="fa-brands fa-google-play" /> Google Play</span>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-text-secondary">
        © {new Date().getFullYear()} LifeGrid. All rights reserved.
      </div>
    </footer>
  );
}
