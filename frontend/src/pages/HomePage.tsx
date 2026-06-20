import { useAuthContext } from "../context/AuthContext";

export default function HomePage() {
  const { user } = useAuthContext();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-bold text-gray-900">
        Welcome, {user?.name}
      </h2>
      <p className="text-gray-600 mt-2">System is running.</p>
    </div>
  );
}
