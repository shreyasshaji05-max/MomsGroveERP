import { useEffect, useState } from 'react';
import { Plus, X, Users, Trash2, UserPlus, UserMinus } from 'lucide-react';
import {
  getAllClasses,
  createClass,
  deleteClass,
  getAllStudents,
  getTeacherUsers,
  enrollStudent,
  unenrollStudent,
  getClassEnrollments,
  Class,
  Student,
  User,
  Enrollment,
} from '../../services/adminService';

interface NewClassForm {
  name: string;
  teacher_id: string;
}

export function ClassManagementPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [showClassModal, setShowClassModal] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classEnrollments, setClassEnrollments] = useState<Enrollment[]>([]);
  
  const [classForm, setClassForm] = useState<NewClassForm>({ name: '', teacher_id: '' });
  const [enrollmentForm, setEnrollmentForm] = useState({ student_id: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [classesData, studentsData, teachersData] = await Promise.all([
        getAllClasses(),
        getAllStudents(),
        getTeacherUsers(),
      ]);

      setClasses(classesData);
      setStudents(studentsData);
      setTeachers(teachersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (!classForm.name.trim() || !classForm.teacher_id) {
        setError('Class name and teacher are required');
        return;
      }

      await createClass(classForm.name, classForm.teacher_id);
      setSuccess('Class created successfully');
      await fetchData();
      setClassForm({ name: '', teacher_id: '' });
      setShowClassModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create class');
      console.error('Error creating class:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class? This will also remove all enrollments.')) return;

    try {
      setError(null);
      await deleteClass(id);
      setSuccess('Class deleted successfully');
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete class');
      console.error('Error deleting class:', err);
    }
  };

  const handleViewEnrollments = async (cls: Class) => {
    try {
      setSelectedClass(cls);
      const enrollments = await getClassEnrollments(cls.id);
      setClassEnrollments(enrollments);
      setShowEnrollmentModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load enrollments');
      console.error('Error loading enrollments:', err);
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    try {
      setSubmitting(true);
      setError(null);

      if (!enrollmentForm.student_id) {
        setError('Please select a student');
        return;
      }

      await enrollStudent(enrollmentForm.student_id, selectedClass.id);
      setSuccess('Student enrolled successfully');
      const enrollments = await getClassEnrollments(selectedClass.id);
      setClassEnrollments(enrollments);
      setEnrollmentForm({ student_id: '' });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll student');
      console.error('Error enrolling student:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnenrollStudent = async (studentId: string) => {
    if (!selectedClass) return;
    if (!confirm('Are you sure you want to remove this student from the class?')) return;

    try {
      setError(null);
      await unenrollStudent(studentId, selectedClass.id);
      setSuccess('Student removed from class');
      const enrollments = await getClassEnrollments(selectedClass.id);
      setClassEnrollments(enrollments);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove student');
      console.error('Error removing student:', err);
    }
  };

  const getEnrolledStudentIds = () => {
    return new Set(classEnrollments.map((e) => e.student_id));
  };

  const getAvailableStudents = () => {
    const enrolledIds = getEnrolledStudentIds();
    return students.filter((s) => !enrolledIds.has(s.id));
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-slate-600">Loading class data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Class Management</h1>
        <p className="text-slate-600">Create classes, assign teachers, and enroll students</p>
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

      <div className="mb-6 flex justify-end">
        <button
          onClick={() => {
            setClassForm({ name: '', teacher_id: '' });
            setShowClassModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
        >
          <Plus size={18} />
          New Class
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Users size={48} className="mx-auto mb-4 text-slate-400" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No Classes Yet</h2>
          <p className="text-slate-600 mb-4">Create your first class to get started</p>
          <button
            onClick={() => setShowClassModal(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
          >
            Create Class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{cls.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">Teacher: {cls.teacher_name}</p>
                </div>
                <button
                  onClick={() => handleDeleteClass(cls.id)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Delete Class"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleViewEnrollments(cls)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
                >
                  <Users size={16} />
                  Manage Students
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      {showClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Create New Class</h3>
              <button
                onClick={() => {
                  setShowClassModal(false);
                  setClassForm({ name: '', teacher_id: '' });
                }}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Class Name *</label>
                <input
                  type="text"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="e.g., Class A, Grade 1"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Teacher *</label>
                <select
                  value={classForm.teacher_id}
                  onChange={(e) => setClassForm({ ...classForm, teacher_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  disabled={submitting}
                  required
                >
                  <option value="">Select a teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.full_name || 'Unknown'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowClassModal(false);
                    setClassForm({ name: '', teacher_id: '' });
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
                  {submitting ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enrollment Modal */}
      {showEnrollmentModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Manage Students - {selectedClass.name}</h3>
                <p className="text-sm text-slate-600 mt-1">Teacher: {selectedClass.teacher_name}</p>
              </div>
              <button
                onClick={() => {
                  setShowEnrollmentModal(false);
                  setSelectedClass(null);
                  setClassEnrollments([]);
                  setEnrollmentForm({ student_id: '' });
                }}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-md font-semibold text-slate-900 mb-4">Enroll New Student</h4>
                <form onSubmit={handleEnrollStudent} className="flex gap-2">
                  <select
                    value={enrollmentForm.student_id}
                    onChange={(e) => setEnrollmentForm({ student_id: e.target.value })}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    disabled={submitting}
                  >
                    <option value="">Select a student</option>
                    {getAvailableStudents().map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                    disabled={submitting || !enrollmentForm.student_id}
                  >
                    <UserPlus size={18} />
                    Enroll
                  </button>
                </form>
              </div>

              <div>
                <h4 className="text-md font-semibold text-slate-900 mb-4">
                  Enrolled Students ({classEnrollments.length})
                </h4>
                {classEnrollments.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No students enrolled yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Student Name</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date of Birth</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {classEnrollments.map((enrollment) => {
                          const student = students.find((s) => s.id === enrollment.student_id);
                          return (
                            <tr key={enrollment.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4 text-sm font-medium text-slate-900">
                                {enrollment.student_name || student?.name || 'Unknown'}
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-600">
                                {student?.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="py-3 px-4 text-sm">
                                <button
                                  onClick={() => handleUnenrollStudent(enrollment.student_id)}
                                  className="flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors"
                                  title="Remove from class"
                                >
                                  <UserMinus size={16} />
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

