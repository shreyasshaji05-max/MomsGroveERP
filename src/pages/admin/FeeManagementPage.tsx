import { useEffect, useState } from 'react';
import { Plus, X, Search } from 'lucide-react';
import {
  getAllInvoices,
  createInvoice,
  updateInvoiceStatus,
  getAllFeeStructures,
  createFeeStructure,
  getAllStudents,
  Invoice,
  FeeStructure,
  Student,
} from '../../services/adminService';

type Tab = 'invoices' | 'fee-structures';

interface NewInvoiceForm {
  student_id: string;
  amount_due: string;
  due_date: string;
}

interface NewFeeStructureForm {
  name: string;
  amount: string;
  billing_cycle: 'monthly' | 'quarterly' | 'annually' | 'one-time';
  description: string;
}

export function FeeManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState<NewInvoiceForm>({ student_id: '', amount_due: '', due_date: '' });
  const [feeForm, setFeeForm] = useState<NewFeeStructureForm>({ name: '', amount: '', billing_cycle: 'monthly', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [invoicesData, feesData, studentsData] = await Promise.all([
          getAllInvoices(),
          getAllFeeStructures(),
          getAllStudents(),
        ]);

        setInvoices(invoicesData);
        setFeeStructures(feesData);
        setStudents(studentsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load fee data');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (!invoiceForm.student_id || !invoiceForm.amount_due || !invoiceForm.due_date) {
        setError('All fields are required');
        return;
      }

      const newInvoice = await createInvoice(
        invoiceForm.student_id,
        parseFloat(invoiceForm.amount_due),
        invoiceForm.due_date
      );

      const student = students.find((s) => s.id === invoiceForm.student_id);
      setInvoices([{ ...newInvoice, student_name: student?.name || 'Unknown' }, ...invoices]);
      setInvoiceForm({ student_id: '', amount_due: '', due_date: '' });
      setShowInvoiceModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
      console.error('Error creating invoice:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFeeStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (!feeForm.name || !feeForm.amount || !feeForm.billing_cycle) {
        setError('Name, amount, and billing cycle are required');
        return;
      }

      const newFee = await createFeeStructure(
        feeForm.name,
        parseFloat(feeForm.amount),
        feeForm.billing_cycle,
        feeForm.description || undefined
      );

      setFeeStructures([newFee, ...feeStructures]);
      setFeeForm({ name: '', amount: '', billing_cycle: 'monthly', description: '' });
      setShowFeeModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create fee structure');
      console.error('Error creating fee structure:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateInvoiceStatus = async (id: string, newStatus: string) => {
    try {
      setError(null);
      await updateInvoiceStatus(id, newStatus);
      setInvoices(
        invoices.map((inv) =>
          inv.id === id ? { ...inv, status: newStatus as any } : inv
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update invoice');
      console.error('Error updating invoice:', err);
    }
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.amount_due.toString().includes(searchTerm)
  );

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-slate-600">Loading fee data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Fee Management</h1>
        <p className="text-slate-600">Manage invoices and fee structures</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-slate-200 flex">
          {(['invoices', 'fee-structures'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'text-slate-900 border-b-2 border-slate-900 bg-slate-50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'invoices' ? 'Invoices' : 'Fee Structures'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'invoices' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-lg font-bold text-slate-900">All Invoices ({invoices.length})</h2>
                <button
                  onClick={() => setShowInvoiceModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
                >
                  <Plus size={18} />
                  Create Invoice
                </button>
              </div>

              <div className="mb-6 relative">
                <Search size={18} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student name or amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {filteredInvoices.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No invoices found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Student</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Due Date</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredInvoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 text-sm font-medium text-slate-900">{invoice.student_name}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">₹{invoice.amount_due.toFixed(2)}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {new Date(invoice.due_date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(invoice.status)}`}>
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {invoice.status !== 'paid' && (
                              <select
                                value={invoice.status}
                                onChange={(e) => handleUpdateInvoiceStatus(invoice.id, e.target.value)}
                                className="px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                              >
                                <option value="pending">Pending</option>
                                <option value="paid">Mark Paid</option>
                                <option value="overdue">Overdue</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'fee-structures' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900">Fee Structures ({feeStructures.length})</h2>
                <button
                  onClick={() => setShowFeeModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
                >
                  <Plus size={18} />
                  New Fee Structure
                </button>
              </div>

              {feeStructures.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No fee structures found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Billing Cycle</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Description</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {feeStructures.map((fee) => (
                        <tr key={fee.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 text-sm font-medium text-slate-900">{fee.name}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">₹{fee.amount.toFixed(2)}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {fee.billing_cycle.charAt(0).toUpperCase() + fee.billing_cycle.slice(1)}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600">{fee.description || 'N/A'}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              fee.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                            }`}>
                              {fee.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
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

      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Create Invoice</h3>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleAddInvoice} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Student *</label>
                <select
                  value={invoiceForm.student_id}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, student_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  disabled={submitting}
                >
                  <option value="">Select a student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Amount Due (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={invoiceForm.amount_due}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, amount_due: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="0.00"
                  disabled={submitting}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Due Date *</label>
                <input
                  type="date"
                  value={invoiceForm.due_date}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  disabled={submitting}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
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
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">New Fee Structure</h3>
              <button
                onClick={() => setShowFeeModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleAddFeeStructure} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Fee Name *</label>
                <input
                  type="text"
                  value={feeForm.name}
                  onChange={(e) => setFeeForm({ ...feeForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="e.g., Tuition Fee"
                  disabled={submitting}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={feeForm.amount}
                  onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="0.00"
                  disabled={submitting}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Billing Cycle *</label>
                <select
                  value={feeForm.billing_cycle}
                  onChange={(e) => setFeeForm({ ...feeForm, billing_cycle: e.target.value as NewFeeStructureForm['billing_cycle'] })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  disabled={submitting}
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                  <option value="one-time">One Time</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={feeForm.description}
                  onChange={(e) => setFeeForm({ ...feeForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Optional description"
                  rows={3}
                  disabled={submitting}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowFeeModal(false)}
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
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
