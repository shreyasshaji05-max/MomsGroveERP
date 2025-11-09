import { supabase } from '../supabaseClient';

export interface Student {
  id: string;
  name: string;
  dob: string | null;
  parent_id: string | null;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  class_name?: string;
}

export interface Invoice {
  id: string;
  amount_due: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  fee_structure_name?: string;
}

export interface SkillEvidence {
  id: string;
  skill_name: string;
  description: string | null;
  date_recorded: string;
  recorded_by_name?: string;
}

/**
 * Fetches the primary child linked to the current authenticated parent.
 * Assumes a parent typically has one primary child for dashboard display,
 * or returns the first one found.
 */
export async function getParentChild(parentId: string): Promise<Student | null> {
  const { data, error } = await supabase
    .from('students')
    .select('id, name, dob, parent_id')
    .eq('parent_id', parentId)
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error('Error fetching parent\'s child:', error);
    throw error;
  }

  return data || null;
}

/**
 * Fetches a child's attendance status for a specific date.
 */
export async function getChildAttendanceForToday(studentId: string): Promise<AttendanceRecord | null> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      id,
      date,
      status,
      classes (name)
    `)
    .eq('student_id', studentId)
    .eq('date', today)
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching child attendance for today:', error);
    throw error;
  }

  return data ? { ...data, class_name: data.classes?.name || 'N/A' } : null;
}

/**
 * Fetches the next upcoming invoice for a child.
 */
export async function getChildNextUpcomingInvoice(studentId: string): Promise<Invoice | null> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      id,
      amount_due,
      due_date,
      status,
      fee_structures (name)
    `)
    .eq('student_id', studentId)
    .eq('status', 'pending')
    .gte('due_date', today) // Greater than or equal to today
    .order('due_date', { ascending: true })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching child\'s next upcoming invoice:', error);
    throw error;
  }

  return data ? { ...data, fee_structure_name: data.fee_structures?.name || 'General Fee' } : null;
}

/**
 * Fetches the latest skill evidence entries for a child.
 */
export async function getChildLatestSkillEvidence(studentId: string, limit: number = 3): Promise<SkillEvidence[]> {
  const { data, error } = await supabase
    .from('skill_evidence')
    .select(`
      id,
      skill_name,
      description,
      date_recorded,
      profiles (full_name)
    `)
    .eq('student_id', studentId)
    .order('date_recorded', { ascending: false })
    .order('created_at', { ascending: false }) // Secondary sort for consistency
    .limit(limit);

  if (error) {
    console.error('Error fetching child\'s latest skill evidence:', error);
    throw error;
  }

  return (data || []).map((evidence: any) => ({
    ...evidence,
    recorded_by_name: evidence.profiles?.full_name || 'Unknown Teacher',
  }));
}
