import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { SignupPage } from '../pages/SignupPage';
import { LoginPage } from '../pages/LoginPage';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '../layouts/AppLayout';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { TeacherDashboard } from '../pages/dashboards/TeacherDashboard';
import { ParentDashboard } from '../pages/parent/ParentDashboard';
import { AttendancePage } from '../pages/teacher/AttendancePage';
import { FeeManagementPage } from '../pages/admin/FeeManagementPage';
import { EnrollmentPage } from '../pages/admin/EnrollmentPage';
import { ClassManagementPage } from '../pages/admin/ClassManagementPage';
import { CalendarPage } from '../pages/admin/CalendarPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';

const router = createBrowserRouter([
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true, // This will be redirected by AppLayout based on role
        element: <PlaceholderPage />,
      },
      {
        path: 'admin/dashboard',
        element: <AdminDashboard />,
      },
      {
        path: 'admin/fees',
        element: <FeeManagementPage />,
      },
      {
        path: 'admin/enrollment',
        element: <EnrollmentPage />,
      },
      {
        path: 'admin/classes',
        element: <ClassManagementPage />,
      },
      {
        path: 'admin/calendar',
        element: <CalendarPage />,
      },
      {
        path: 'teacher/dashboard',
        element: <TeacherDashboard />,
      },
      {
        path: 'teacher/attendance',
        element: <AttendancePage />,
      },
      {
        path: 'teacher/students', // Added for teacher
        element: <PlaceholderPage />,
      },
      {
        path: 'parent/dashboard',
        element: <ParentDashboard />,
      },
      {
        path: 'parent/my-child', // Added for parent
        element: <PlaceholderPage />,
      },
      {
        path: 'parent/fee-status', // Added for parent
        element: <PlaceholderPage />,
      },
      {
        path: '*', // Catch-all for authenticated users
        element: <PlaceholderPage />,
      },
    ],
  },
  {
    path: '*', // Catch-all for unauthenticated users or unknown routes
    element: <LoginPage />, // Redirect to login for any unmatched route outside protected area
  },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}
