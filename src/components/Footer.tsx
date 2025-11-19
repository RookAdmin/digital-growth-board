import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-[#131313] text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60 mb-3">
              Realm by Rook Concierge
            </p>
            <p className="text-lg font-light text-white/90 max-w-xl">
              A private workspace crafted for clients who value rhythm, clarity,
              and concierge-level project care.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-white/70">
            <span>hlo@realmrook.com</span>
            <Link to="/register" className="hover:text-white transition">
              Contact →
            </Link>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-white/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <span>© 2025 Rook Ecom Private Limited. All rights reserved.</span>
          <div className="flex gap-6">
            <a
              href="https://realmrook.com/privacy-policy"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition"
            >
              Privacy
            </a>
            <a
              href="https://realmrook.com/terms-and-conditions"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

