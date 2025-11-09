<boltAction type="file" filePath="src/pages/PlaceholderPage.tsx">import React from 'react';
import { useOutletContext } from 'react-router-dom';

interface ProfileContext {
  profile: {
    id: string;
    full_name: string;
    role: string;
  };
}

export function PlaceholderPage() {
  const { profile } = useOutletContext<ProfileContext>();

  return (
    <div className="flex-1 p-8 bg-slate-50">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Welcome, {profile.full_name}!</h1>
        <p className="text-slate-600 text-lg mb-4">
          This is a placeholder page for a feature that is currently under development.
        </p>
        <p className="text-slate-600 text-lg mb-4">
          Your role is: <span className="font-semibold text-green-700 capitalize">{profile.role}</span>.
        </p>
        <p className="text-slate-500 text-base">
          Please check back later for updates.
        </p>
      </div>
    </div>
  );
}
