import { Link, useLocation } from "react-router-dom";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-lg w-full glass-card p-10 text-center space-y-6 border border-white/5">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <ShieldX className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-3xl font-display font-semibold tracking-tight text-foreground">Access Denied</h1>
        <p className="text-sm text-muted-foreground">
          You are signed in, but you do not have permission to view this page.
          {from ? ` Requested path: ${from}` : ""}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/" className="px-5 py-3 rounded-xl border border-white/10 text-sm font-semibold text-foreground hover:bg-white/5 transition-colors">
            Go Home
          </Link>
          <Link to="/login" className="px-5 py-3 rounded-xl bg-primary text-black text-sm font-semibold hover:opacity-90 transition-opacity">
            Switch Account
          </Link>
        </div>
      </div>
    </div>
  );
}
