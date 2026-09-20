import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg text-center">
        <div className="mb-6">
          <h1 className="text-8xl sm:text-9xl font-extrabold text-gray-200">
            404
          </h1>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Page Not Found
        </h2>

        <p className="mt-3 text-sm sm:text-base text-gray-500">
          Sorry, the page you're looking for doesn't exist or may have been
          moved.
        </p>

        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200"
          >
            ← Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
