import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  fullHeight?: boolean;
}

export const LoadingState = ({ message = "Loading data...", fullHeight = false }: LoadingStateProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        fullHeight ? "min-h-[50vh]" : "py-12"
      )}
    >
      <div className="h-12 w-12 rounded-full border-2 border-[#131313] border-t-transparent animate-spin" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
};

