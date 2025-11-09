import { useEffect, useState } from 'react';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';
import {
  getAllStudents,
  createStudent,
  deleteStudent,
  updateStudent,
  getTeacherUsers,
  getAllUsers,
  createTeacher,
  createParent,
  User,
  Student,
} from '../../services/adminService';

type Tab = 'students' | 'teachers' | 'parents';

interface NewStudentForm {
  name: string;
  dob: string;
  parent_id: string;
}

interface NewTeacherForm {
  full_name: string;
  email: string;
  password: string;
}

interface NewParentForm {
  full_name: string;
  email: string;
  password: string;
}

export function EnrollmentPage() {
  const [activeTab, setActiveTab] = useState<Tab>('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [parents, setParents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Student modals
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState<NewStudentForm>({ name: '', dob: '', parent_id: '' });
  
  // Teacher modals
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherForm, setTeacherForm] = useState<NewTeacherForm>({ full_name: '', email: '', password: '' });
  
  // Parent modals
  const [showParentModal, setShowParentModal] = useState(false);
  const [parentForm, setParentForm] = useState<NewParentForm>({ full_name: '', email: '', password: '' });
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [studentsData, teachersData, allUsers] = await Promise.all([
        getAllStudents(),
        getTeacherUsers(),
        getAllUsers(),
      ]);

      setStudents(studentsData);
      setTeachers(teachersData);
      setParents(allUsers.filter((u) => u.role === 'parent'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load enrollment data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (!studentForm.name.trim()) {
        setError('Student name is required');
        return;
      }

      if (editingStudent) {
        await updateStudent(editingStudent.id, {
          name: studentForm.name,
          dob: studentForm.dob || null,
          parent_id: studentForm.parent_id || null,
        });
        setSuccess('Student updated successfully');
      } else {
        await createStudent(
          studentForm.name,
          studentForm.dob || null,
          studentForm.parent_id || null
        );
        setSuccess('Student created successfully');
      }

      await fetchData();
      setStudentForm({ name: '', dob: '', parent_id: '' });
      setEditingStudent(null);
      setShowStudentModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save student');
      console.error('Error saving student:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setStudentForm({
      name: student.name,
      dob: student.dob || '',
      parent_id: student.parent_id || '',
    });
    setShowStudentModal(true);
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      setError(null);
      await deleteStudent(id);
      setSuccess('Student deleted successfully');
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete student');
      console.error('Error deleting student:', err);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (!teacherForm.full_name.trim() || !teacherForm.email.trim() || !teacherForm.password.trim()) {
        setError('All fields are required');
        return;
      }

      // Note: This requires service role or Edge Function
      // For now, we'll use a workaround
      await createTeacher(teacherForm.full_name, teacherForm.email, teacherForm.password);
      setSuccess('Teacher created successfully. They can now login with the provided credentials.');
      await fetchData();
      setTeacherForm({ full_name: '', email: '', password: '' });
      setShowTeacherModal(false);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create teacher. Note: This feature requires server-side setup.');
      console.error('Error creating teacher:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (!parentForm.full_name.trim() || !parentForm.email.trim() || !parentForm.password.trim()) {
        setError('All fields are required');
        return;
      }

      await createParent(parentForm.full_name, parentForm.email, parentForm.password);
      setSuccess('Parent created successfully. They can now login with the provided credentials.');
      await fetchData();
      setParentForm({ full_name: '', email: '', password: '' });
      setShowParentModal(false);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create parent. Note: This feature requires server-side setup.');
      console.error('Error creating parent:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return 'No Parent';
    const parent = parents.find((p) => p.id === parentId);
    return parent?.full_name || 'Unknown Parent';
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-slate-600">Loading enrollment data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Enrollment Management</h1>
        <p className="text-slate-600">Manage students, teachers, and parents</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-slate-200 flex">
          {(['students', 'teachers', 'parents'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'text-slate-900 border-b-2 border-slate-900 bg-slate-50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'students' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900">All Students ({students.length})</h2>
                <button
                  onClick={() => {
                    setEditingStudent(null);
                    setStudentForm({ name: '', dob: '', parent_id: '' });
                    setShowStudentModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
                >
                  <Plus size={18} />
                  New Student
                </button>
              </div>

              {students.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No students found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date of Birth</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Parent</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Joined</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 text-sm font-medium text-slate-900">{student.name}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {getParentName(student.parent_id)}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {student.created_at ? new Date(student.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditStudent(student)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student.id)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'teachers' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900">All Teachers ({teachers.length})</h2>
                <button
                  onClick={() => {
                    setTeacherForm({ full_name: '', email: '', password: '' });
                    setShowTeacherModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
                >
                  <Plus size={18} />
                  New Teacher
                </button>
              </div>

              {teachers.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No teachers found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {teachers.map((teacher) => (
                        <tr key={teacher.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 text-sm font-medium text-slate-900">{teacher.full_name || 'N/A'}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">{teacher.id}</td>
                          <td className="py-3 px-4 text-sm text-slate-600 capitalize">{teacher.role}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'parents' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900">All Parents ({parents.length})</h2>
                <button
                  onClick={() => {
                    setParentForm({ full_name: '', email: '', password: '' });
                    setShowParentModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
                >
                  <Plus size={18} />
                  New Parent
                </button>
              </div>

              {parents.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No parents found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {parents.map((parent) => (
                        <tr key={parent.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 text-sm font-medium text-slate-900">{parent.full_name || 'N/A'}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">{parent.id}</td>
                          <td className="py-3 px-4 text-sm text-slate-600 capitalize">{parent.role}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h3>
              <button
                onClick={() => {
                  setShowStudentModal(false);
                  setEditingStudent(null);
                  setStudentForm({ name: '', dob: '', parent_id: '' });
                }}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Student Name *</label>
                <input
                  type="text"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Enter student name"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={studentForm.dob}
                  onChange={(e) => setStudentForm({ ...studentForm, dob: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  disabled={submitting}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Parent</label>
                <select
                  value={studentForm.parent_id}
                  onChange={(e) => setStudentForm({ ...studentForm, parent_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  disabled={submitting}
                >
                  <option value="">No Parent</option>
                  {parents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.full_name || 'Unknown'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowStudentModal(false);
                    setEditingStudent(null);
                    setStudentForm({ name: '', dob: '', parent_id: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editingStudent ? 'Update' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Modal */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Add New Teacher</h3>
              <button
                onClick={() => {
                  setShowTeacherModal(false);
                  setTeacherForm({ full_name: '', email: '', password: '' });
                }}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={teacherForm.full_name}
                  onChange={(e) => setTeacherForm({ ...teacherForm, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Enter teacher name"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={teacherForm.email}
                  onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="teacher@example.com"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Password *</label>
                <input
                  type="password"
                  value={teacherForm.password}
                  onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Minimum 6 characters"
                  disabled={submitting}
                  required
                  minLength={6}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowTeacherModal(false);
                    setTeacherForm({ full_name: '', email: '', password: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Parent Modal */}
      {showParentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Add New Parent</h3>
              <button
                onClick={() => {
                  setShowParentModal(false);
                  setParentForm({ full_name: '', email: '', password: '' });
                }}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleAddParent} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={parentForm.full_name}
                  onChange={(e) => setParentForm({ ...parentForm, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Enter parent name"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={parentForm.email}
                  onChange={(e) => setParentForm({ ...parentForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="parent@example.com"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Password *</label>
                <input
                  type="password"
                  value={parentForm.password}
                  onChange={(e) => setParentForm({ ...parentForm, password: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Minimum 6 characters"
                  disabled={submitting}
                  required
                  minLength={6}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowParentModal(false);
                    setParentForm({ full_name: '', email: '', password: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Parent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
