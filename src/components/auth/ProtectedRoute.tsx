import { Navigate } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse [animation-delay:200ms]" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse [animation-delay:400ms]" />
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
