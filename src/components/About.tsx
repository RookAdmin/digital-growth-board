
import {
  Clock,
  MessageCircle,
  FolderOpen,
  Layout,
  ShieldCheck,
} from "lucide-react";

const essentials = [
  {
    icon: Clock,
    title: "Status at a glance",
    copy: "Live milestones, dates, and next actions in one quiet view.",
  },
  {
    icon: MessageCircle,
    title: "Conversation thread",
    copy: "Context-rich updates without digging through inboxes.",
  },
  {
    icon: FolderOpen,
    title: "Single source of files",
    copy: "Approvals, assets, and contracts stay organized and searchable.",
  },
];

const touchpoints = [
  {
    icon: Layout,
    title: "Weekly pulse",
    copy: "A concise summary so you know what moved — and what’s next.",
  },
  {
    icon: ShieldCheck,
    title: "Transparent decisions",
    copy: "Every change is logged with owners and rationale.",
  },
  {
    icon: Clock,
    title: "Anytime access",
    copy: "Log in from any device and pick up exactly where you left off.",
  },
];

export const About = () => {
  return (
    <div className="bg-white">
      {/* About Portal Section */}
      <section className="py-20 md:py-24 bg-gray-50/70">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-8 tracking-tight">
              About This Portal
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed font-light mb-6">
              A calmer way to follow every Realm engagement. No chasing emails,
              no duplicated threads—just a single, modern home for progress.
            </p>
            <p className="text-base text-gray-500 leading-relaxed font-light">
              Log in, review the latest move, respond, and move on with your
              day.
            </p>
          </div>
        </div>
      </section>

      {/* Essentials */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 max-w-6xl mx-auto">
            {essentials.map((item) => (
              <article
                key={item.title}
                className="rounded-3xl border border-gray-100 bg-gray-50/50 p-6 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl"
              >
                <item.icon className="w-5 h-5 text-gray-900 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {item.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Touchpoints */}
      <section className="py-16 md:py-20 bg-gray-50/70">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-[32px] border border-white/70 bg-white/80 px-6 py-10 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
              <p className="text-sm uppercase tracking-[0.3em] text-gray-500 mb-6">
                How Realm keeps you aligned
              </p>
              <div className="space-y-8">
                {touchpoints.map((item) => (
                  <div
                    key={item.title}
                    className="flex flex-col md:flex-row md:items-start gap-4 border-t border-gray-100 pt-8 first:border-t-0 first:pt-0"
                  >
                    <item.icon className="w-5 h-5 text-gray-900 mt-1" />
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-1">
                        {item.title}
                      </h4>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {item.copy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
