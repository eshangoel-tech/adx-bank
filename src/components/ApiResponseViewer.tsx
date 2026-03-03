"use client";

interface Props {
  response: unknown | null;
  loading: boolean;
  error: string | null;
  title?: string;
}

export function ApiResponseViewer({
  response,
  loading,
  error,
  title = "Response",
}: Props) {
  if (!loading && !error && response === null) return null;

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-gray-600 mb-1">{title}</h3>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
          <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 whitespace-pre-wrap">
          {error}
        </div>
      )}

      {!loading && !error && response !== null && (
        <pre className="bg-gray-900 text-green-300 text-xs rounded p-4 overflow-auto max-h-72 leading-relaxed">
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
}
