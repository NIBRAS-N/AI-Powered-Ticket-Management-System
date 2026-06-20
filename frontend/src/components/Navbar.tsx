import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { authClient } from "../lib/auth-client";

export default function Navbar() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await authClient.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold text-gray-900">AI Ticket System</Link>
            {user?.role === "ADMIN" && (
              <Link
                to="/users"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Users
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">{user?.name}</span>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
