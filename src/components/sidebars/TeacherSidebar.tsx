import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  LogOut,
} from 'lucide-react';

export function TeacherSidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/teacher/dashboard' },
    { name: 'Students', icon: Users, path: '/teacher/students' },
    { name: 'Attendance', icon: CalendarCheck, path: '/teacher/attendance' },
  ];

  return (
    <aside className="w-64 bg-gradient-to-br from-emerald-700 to-emerald-800 text-white shadow-lg p-6 flex flex-col justify-between">
      <div>
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-white tracking-wide">Teacher Panel</h1>
          <p className="text-emerald-300 text-sm mt-1">Mom's Grove</p>
        </div>
        <nav>
          <ul>
            {navItems.map((item) => (
              <li key={item.name} className="mb-3">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center p-3 rounded-lg transition-all duration-200 ease-in-out
                    ${isActive
                      ? 'bg-emerald-600 text-white shadow-md transform translate-x-1'
                      : 'text-emerald-200 hover:bg-emerald-600 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="mt-8">
        <button
          onClick={handleLogout}
          className="flex items-center w-full p-3 rounded-lg text-emerald-200 hover:bg-emerald-600 hover:text-white transition-all duration-200 ease-in-out"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
