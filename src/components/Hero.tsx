
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Shield,
  Users,
  Clock,
  MessageSquare,
  FolderLock,
} from "lucide-react";

const highlights = [
  {
    label: "Live sprints",
    value: "08",
    detail: "currently in motion",
  },
  {
    label: "Avg. response",
    value: "42m",
    detail: "team reply time",
  },
  {
    label: "Files synced",
    value: "312",
    detail: "latest dropbox",
  },
];

export const Hero = () => {
  return (
    <section className="relative bg-white pt-16 pb-24 md:pt-20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-5 py-2 text-xs uppercase tracking-[0.3em] text-gray-500 mb-8">
                <Shield className="w-3.5 h-3.5" />
                Realm workspace
              </div>

              <h1 className="text-4xl md:text-5xl font-light text-gray-900 leading-tight mb-6">
                A calmer command center for every Realm engagement.
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-xl">
                Track deliverables, drop files, and approve work in one minimalist
                space designed for fast-moving founders and teams.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch gap-4 mb-8">
                <Button
                  variant="homepage"
                  size="lg"
                  className="bg-gray-900 hover:bg-black text-white rounded-full px-8 py-5 text-base font-medium shadow-lg shadow-gray-200/80 transition-all duration-300 w-full sm:w-auto"
                  asChild
                >
                  <Link to="/login" className="flex items-center justify-center gap-3">
                    Access your projects
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 rounded-full px-8 py-5 text-base font-medium w-full sm:w-auto"
                  asChild
                >
                  <Link to="/register" className="flex items-center justify-center gap-3">
                    Start a build
                  </Link>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Concierge-managed onboarding</span>
                </div>
                <span className="inline-flex h-1 w-1 rounded-full bg-gray-400" />
                <span>2-minute sign in</span>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[32px] border border-gray-100 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.08)] p-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  {highlights.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-gray-400 mb-2">
                        {item.label}
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                      <p className="text-xs text-gray-500">{item.detail}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-900 text-white rounded-2xl flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Milestone</p>
                      <p className="text-base font-semibold text-gray-900">Creative handoff ready</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 text-gray-900 rounded-2xl flex items-center justify-center">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Newest note</p>
                      <p className="text-base font-semibold text-gray-900">Feedback synced from product team</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 text-gray-900 rounded-2xl flex items-center justify-center">
                      <FolderLock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Files shared</p>
                      <p className="text-base font-semibold text-gray-900">Brand toolkit_v3.zip</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
