import { supabase } from '../supabaseClient';

export interface Student {
  id: string;
  name: string; // Changed from full_name to name
  dob: string | null; // Changed from date_of_birth to dob
  parent_id: string | null;
  created_at: string | null;
}

export interface Teacher {
  id: string;
  user_id: string | null;
  name: string | null;
  created_at: string | null;
}

export interface User {
  id: string;
  full_name: string | null;
  role: 'admin' | 'teacher' | 'parent';
}

export interface Invoice {
  id: string;
  student_id: string;
  fee_structure_id: string | null;
  amount_due: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  created_at: string;
  student_name?: string; // Added for UI display
}

export interface FeeStructure {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  billing_cycle: 'monthly' | 'quarterly' | 'annually' | 'one-time';
  is_active: boolean | null;
  created_at: string;
}

export interface SchoolStats {
  total_students: number;
  total_teachers: number;
  total_overdue_invoices: number;
  students_present_today: number; // Added for consistency with previous context
}

export interface Class {
  id: string;
  name: string;
  teacher_id: string;
  created_at: string;
  teacher_name?: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  created_at: string;
  student_name?: string;
  class_name?: string;
  students?: {
    name: string;
    dob: string | null;
    parent_id: string | null;
  };
}

// Students
export async function getAllStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('id, name, dob, parent_id, created_at') // Select specific columns
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createStudent(name: string, dob: string | null, parent_id: string | null): Promise<Student> {
  const { data, error } = await supabase
    .from('students')
    .insert({ name, dob, parent_id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
  const { data, error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteStudent(id: string): Promise<void> {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Teachers
export async function getAllTeachers(): Promise<Teacher[]> {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getTeacherUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'teacher')
    .order('full_name', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Users (All)
export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Create Teacher (with auth user)
// Note: This requires server-side setup with service role key or Edge Function
// For client-side, we'll use signUp and handle it differently
export async function createTeacher(fullName: string, email: string, password: string): Promise<User> {
  try {
    // Try using admin API (requires service role - will fail on client)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'teacher',
      },
    });

    if (authError) {
      // If admin API fails, fall back to regular signup
      // This requires email confirmation unless disabled in Supabase settings
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'teacher',
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error('Failed to create auth user');

      // Wait a bit for trigger to create profile
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signUpData.user.id)
        .single();

      if (profileError) {
        // Manually create profile if trigger didn't fire
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: signUpData.user.id,
            full_name: fullName,
            role: 'teacher',
          })
          .select()
          .single();

        if (createError) throw createError;
        return newProfile;
      }

      return profile;
    }

    if (!authData.user) throw new Error('Failed to create auth user');

    // Wait for trigger
    await new Promise((resolve) => setTimeout(resolve, 500));

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: fullName,
          role: 'teacher',
        })
        .select()
        .single();

      if (createError) throw createError;
      return newProfile;
    }

    return profile;
  } catch (error: any) {
    throw new Error(`Failed to create teacher: ${error.message}. Note: For production, set up a Supabase Edge Function with service role key.`);
  }
}

// Create Parent (with auth user)
export async function createParent(fullName: string, email: string, password: string): Promise<User> {
  try {
    // Try using admin API first
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'parent',
      },
    });

    if (authError) {
      // Fall back to regular signup
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'parent',
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error('Failed to create auth user');

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signUpData.user.id)
        .single();

      if (profileError) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: signUpData.user.id,
            full_name: fullName,
            role: 'parent',
          })
          .select()
          .single();

        if (createError) throw createError;
        return newProfile;
      }

      return profile;
    }

    if (!authData.user) throw new Error('Failed to create auth user');

    await new Promise((resolve) => setTimeout(resolve, 500));

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: fullName,
          role: 'parent',
        })
        .select()
        .single();

      if (createError) throw createError;
      return newProfile;
    }

    return profile;
  } catch (error: any) {
    throw new Error(`Failed to create parent: ${error.message}. Note: For production, set up a Supabase Edge Function with service role key.`);
  }
}

// Classes
export async function getAllClasses(): Promise<Class[]> {
  const { data: classesData, error: classesError } = await supabase
    .from('classes')
    .select('id, name, teacher_id, created_at')
    .order('created_at', { ascending: false });

  if (classesError) throw classesError;

  // Fetch teacher names separately
  const teacherIds = [...new Set((classesData || []).map((cls) => cls.teacher_id))];
  const { data: teachersData } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', teacherIds);

  const teacherMap = new Map((teachersData || []).map((t) => [t.id, t.full_name]));

  return (classesData || []).map((cls) => ({
    ...cls,
    teacher_name: teacherMap.get(cls.teacher_id) || 'Unknown',
  }));
}

export async function createClass(name: string, teacher_id: string): Promise<Class> {
  const { data, error } = await supabase
    .from('classes')
    .insert({ name, teacher_id })
    .select('id, name, teacher_id, created_at')
    .single();

  if (error) throw error;

  // Fetch teacher name
  const { data: teacher } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', teacher_id)
    .single();

  return {
    ...data,
    teacher_name: teacher?.full_name || 'Unknown',
  };
}

export async function deleteClass(id: string): Promise<void> {
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Enrollments
export async function getAllEnrollments(): Promise<Enrollment[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      id,
      student_id,
      class_id,
      created_at,
      students(name),
      classes(name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((enrollment: any) => ({
    ...enrollment,
    student_name: enrollment.students?.name || 'Unknown',
    class_name: enrollment.classes?.name || 'Unknown',
  }));
}

export async function enrollStudent(student_id: string, class_id: string): Promise<Enrollment> {
  const { data, error } = await supabase
    .from('enrollments')
    .insert({ student_id, class_id })
    .select(`
      id,
      student_id,
      class_id,
      created_at,
      students(name),
      classes(name)
    `)
    .single();

  if (error) throw error;

  return {
    ...data,
    student_name: data.students?.name || 'Unknown',
    class_name: data.classes?.name || 'Unknown',
  };
}

export async function unenrollStudent(student_id: string, class_id: string): Promise<void> {
  const { error } = await supabase
    .from('enrollments')
    .delete()
    .eq('student_id', student_id)
    .eq('class_id', class_id);

  if (error) throw error;
}

export async function getStudentEnrollments(student_id: string): Promise<Enrollment[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      id,
      student_id,
      class_id,
      created_at,
      classes(name)
    `)
    .eq('student_id', student_id);

  if (error) throw error;

  return (data || []).map((enrollment: any) => ({
    ...enrollment,
    class_name: enrollment.classes?.name || 'Unknown',
  }));
}

export async function getClassEnrollments(class_id: string): Promise<Enrollment[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      id,
      student_id,
      class_id,
      created_at,
      students(name, dob, parent_id)
    `)
    .eq('class_id', class_id);

  if (error) throw error;

  return (data || []).map((enrollment: any) => ({
    ...enrollment,
    student_name: enrollment.students?.name || 'Unknown',
  }));
}

// Invoices
export async function getAllInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      id,
      student_id,
      fee_structure_id,
      amount_due,
      due_date,
      status,
      created_at,
      students (name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((invoice: any) => ({
    ...invoice,
    student_name: invoice.students?.name || 'Unknown',
  }));
}

export async function createInvoice(
  student_id: string,
  amount_due: number,
  due_date: string,
  fee_structure_id?: string
): Promise<Invoice> {
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      student_id,
      amount_due,
      due_date,
      fee_structure_id: fee_structure_id || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateInvoiceStatus(id: string, status: string): Promise<Invoice> {
  const { data, error } = await supabase
    .from('invoices')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getOverdueInvoicesCount(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const { count, error } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
    .lt('due_date', today);

  if (error) throw error;
  return count || 0;
}

// Fee Structures
export async function getAllFeeStructures(): Promise<FeeStructure[]> {
  const { data, error } = await supabase
    .from('fee_structures')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createFeeStructure(
  name: string,
  amount: number,
  billing_cycle: 'monthly' | 'quarterly' | 'annually' | 'one-time',
  description?: string,
  is_active: boolean = true
): Promise<FeeStructure> {
  const { data, error } = await supabase
    .from('fee_structures')
    .insert({
      name,
      amount,
      billing_cycle,
      description: description || null,
      is_active,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFeeStructure(id: string, updates: Partial<FeeStructure>): Promise<FeeStructure> {
  const { data, error } = await supabase
    .from('fee_structures')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// School Statistics
export async function getSchoolStats(): Promise<SchoolStats> {
  const today = new Date().toISOString().split('T')[0];

  // Helper function to safely get count
  const getCount = async (queryPromise: Promise<any>): Promise<number> => {
    try {
      const { count, error } = await queryPromise;
      if (error) {
        console.error('Error getting count:', error);
        return 0;
      }
      return count || 0;
    } catch (err) {
      console.error('Error in getCount:', err);
      return 0;
    }
  };

  // Helper function to safely get overdue invoices count
  const getOverdueCount = async (): Promise<number> => {
    try {
      return await getOverdueInvoicesCount();
    } catch (err) {
      console.error('Error getting overdue invoices count:', err);
      return 0;
    }
  };

  const [
    total_students,
    total_teachers,
    students_present_today,
    overdueInvoices,
  ] = await Promise.all([
    getCount(supabase.from('students').select('*', { count: 'exact', head: true })),
    getCount(supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher')),
    getCount(supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'present')),
    getOverdueCount(),
  ]);

  return {
    total_students,
    total_teachers,
    students_present_today,
    total_overdue_invoices: overdueInvoices,
  };
}

export async function getRecentEnrollments(limit: number = 5): Promise<(Student & { days_ago: number })[]> {
  const { data, error } = await supabase
    .from('students')
    .select('id, name, dob, parent_id, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent enrollments:', error);
    // Return empty array instead of throwing to prevent UI crash
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  const now = new Date();
  return data.map((student) => ({
    ...student,
    days_ago: Math.floor((now.getTime() - new Date(student.created_at || now).getTime()) / (1000 * 60 * 60 * 24)),
  }));
}
