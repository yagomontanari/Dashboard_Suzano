import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const SkeletonCard = () => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-pulse">
        <div className="flex justify-between items-start">
            <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-2/3 mb-4"></div>
                <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            </div>
            <div className="p-3 bg-slate-100 rounded-lg w-12 h-12"></div>
        </div>
    </div>
);

const DashboardSkeleton = () => {
    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header Skeleton */}
            <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10 w-full">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <div className="h-8 bg-slate-200 rounded w-48 mb-2"></div>
                        <div className="h-4 bg-slate-100 rounded w-32"></div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-8 bg-slate-100 rounded w-24"></div>
                    ))}
                </div>
            </div>

            <main className="flex-1 p-8 space-y-8 max-w-[1600px] w-full mx-auto">
                {/* KPI Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Chart Skeleton */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
                        <div className="h-6 bg-slate-200 rounded w-48 mb-8"></div>
                        <div className="w-full h-64 bg-slate-50 rounded-lg"></div>
                    </div>

                    {/* Side List Skeleton */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="h-6 bg-slate-200 rounded w-48 mb-6"></div>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                <div key={i} className="h-16 bg-slate-50 rounded-lg border border-slate-100"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardSkeleton;
