'use client'

import Link from 'next/link'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email Verification Issue
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            There was a problem with your email verification link.
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="space-y-4">
            <div className="text-sm text-gray-700">
              <p className="mb-4">
                This could happen if:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The verification link has expired</li>
                <li>The link has already been used</li>
                <li>The link was corrupted or incomplete</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                What to do next:
              </h3>
              <div className="space-y-3">
                <Link
                  href="/signup"
                  className="block w-full text-center px-4 py-2 border border-indigo-300 text-indigo-700 rounded-md hover:bg-indigo-50 transition-colors"
                >
                  Try signing up again
                </Link>
                <Link
                  href="/login"
                  className="block w-full text-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Already have an account? Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Need help? Contact support for assistance.
          </p>
        </div>
      </div>
    </div>
  )
}
