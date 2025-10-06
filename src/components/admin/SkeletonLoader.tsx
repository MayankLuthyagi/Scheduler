export default function SkeletonLoader() {
    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
            <div className="mt-6 h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
    );
}