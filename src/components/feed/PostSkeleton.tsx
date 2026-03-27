// src/components/feed/PostSkeleton.tsx
export function PostSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 animate-pulse">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mt-1" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
      </div>
      <div className="mt-4 flex space-x-4">
        <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}
