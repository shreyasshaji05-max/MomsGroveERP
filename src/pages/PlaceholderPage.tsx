import { useLocation } from 'react-router-dom';
import { Wrench } from 'lucide-react';

export function PlaceholderPage() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6 bg-slate-50 text-center">
      <Wrench size={64} className="text-slate-400 mb-6" />
      <h1 className="text-3xl font-bold text-slate-800 mb-3">Under Construction</h1>
      <p className="text-xl text-slate-600 mb-2">
        The page for <code className="bg-slate-200 px-2 py-1 rounded">{path}</code> is still being built.
      </p>
      <p className="text-slate-500 max-w-md">
        We're working hard to bring you this feature. Please check back later!
      </p>
    </div>
  );
}
