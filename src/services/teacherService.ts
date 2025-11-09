import { supabase } from '../supabaseClient';

export interface Student {
  id: string;
  name: string;
  dob: string | null;
  parent_id: string | null;
  created_at: string | null;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string | null;
  date: string;
  status: 'present' | 'absent' | 'late';
  recorded_by: string | null;
  recorded_at: string | null;
}

export interface TeacherStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
}

export async function getTeacherStudents(teacherId: string): Promise<Student[]> {
  const { data, error } = await supabase
    .from('classes')
    .select('id')
    .eq('teacher_id', teacherId);

  if (error) throw error;

  if (!data || data.length === 0) {
    return [];
  }

  const classIds = data.map((c) => c.id);

  const { data: enrollments, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('student_id')
    .in('class_id', classIds);

  if (enrollmentError) throw enrollmentError;

  if (!enrollments || enrollments.length === 0) {
    return [];
  }

  const studentIds = enrollments.map((e) => e.student_id);

  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('*')
    .in('id', studentIds);

  if (studentError) throw studentError;

  return students || [];
}

export async function getAttendanceForDate(
  studentIds: string[],
  date: string
): Promise<AttendanceRecord[]> {
  if (studentIds.length === 0) return [];

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .in('student_id', studentIds)
    .eq('date', date);

  if (error) throw error;

  return data || [];
}

export async function upsertAttendance(
  studentId: string,
  date: string,
  status: 'present' | 'absent' | 'late',
  teacherId: string,
  classId?: string | null
): Promise<AttendanceRecord> {
  const { data: existing, error: fetchError } = await supabase
    .from('attendance')
    .select('id')
    .eq('student_id', studentId)
    .eq('date', date)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existing) {
    const { data, error } = await supabase
      .from('attendance')
      .update({
        status,
        recorded_by: teacherId,
        recorded_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        student_id: studentId,
        date,
        status,
        recorded_by: teacherId,
        class_id: classId || null, // classId is optional, can be null
        recorded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export async function getTeacherStats(
  teacherId: string,
  date: string
): Promise<TeacherStats> {
  const students = await getTeacherStudents(teacherId);
  const totalStudents = students.length;

  if (totalStudents === 0) {
    return { totalStudents: 0, presentToday: 0, absentToday: 0 };
  }

  const studentIds = students.map((s) => s.id);
  const attendance = await getAttendanceForDate(studentIds, date);

  const presentToday = attendance.filter((a) => a.status === 'present').length;
  const absentToday = attendance.filter((a) => a.status === 'absent').length;

  return { totalStudents, presentToday, absentToday };
}
