import { ReactNode } from "react";

interface PageHeroProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  subtleAccent?: boolean;
}

export const PageHero = ({
  title,
  description,
  actions,
  subtleAccent = false,
}: PageHeroProps) => {
  return (
    <div className="flex items-center justify-between gap-4 pb-4">
      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};

