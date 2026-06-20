import { useAuth } from "../hooks/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl font-bold text-gray-900">AI Ticket System</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">{user?.name}</span>
            <button
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              {logout.isPending ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
