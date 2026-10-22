import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { EmptyState } from './components/ui.jsx';

import StudentDashboard from './pages/student/Dashboard.jsx';
import Apply from './pages/student/Apply.jsx';
import MyDocuments from './pages/student/MyDocuments.jsx';
import MyPayments from './pages/student/MyPayments.jsx';
import CutoffsExplorer from './pages/student/Cutoffs.jsx';
import Curriculum from './pages/student/Curriculum.jsx';
import Profile from './pages/student/Profile.jsx';

import AdminOverview from './pages/admin/Overview.jsx';
import ManageApplications from './pages/admin/Applications.jsx';
import ManageStudents from './pages/admin/Students.jsx';
import VerifyDocuments from './pages/admin/VerifyDocuments.jsx';
import ManagePayments from './pages/admin/Payments.jsx';
import ManageCutoffs from './pages/admin/Cutoffs.jsx';
import ManageScholarships from './pages/admin/Scholarships.jsx';
import ManageCourses from './pages/admin/Courses.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="student">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="apply" element={<Apply />} />
        <Route path="documents" element={<MyDocuments />} />
        <Route path="payments" element={<MyPayments />} />
        <Route path="cutoffs" element={<CutoffsExplorer />} />
        <Route path="curriculum" element={<Curriculum />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <DashboardLayout admin />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="applications" element={<ManageApplications />} />
        <Route path="students" element={<ManageStudents />} />
        <Route path="documents" element={<VerifyDocuments />} />
        <Route path="payments" element={<ManagePayments />} />
        <Route path="cutoffs" element={<ManageCutoffs />} />
        <Route path="scholarships" element={<ManageScholarships />} />
        <Route path="courses" element={<ManageCourses />} />
      </Route>

      <Route
        path="*"
        element={
          <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
            <EmptyState icon="🧭" title="Page not found" message="The page you are looking for does not exist." />
          </div>
        }
      />
    </Routes>
  );
}
