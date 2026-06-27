import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Search,
  Plus,
  Save,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Printer,
  DollarSign,
  ArrowDownCircle,
} from 'lucide-react';
import { useAuth } from '@/features/authentication/context';
import {
  getPayments,
  createPayment,
  getPatientFinancial,
  getPatients,
  getDoctors,
} from './api';
import type { Payment } from './types';

// Zod validation schema
const formSchema = z.object({
  patientId: z.string().uuid('Please select a patient'),
  doctorId: z.string().uuid('Please select a doctor'),
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.enum(['Cash', 'Visa', 'Insurance', 'Wallet']),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional().nullable(),
  paymentDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function PaymentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // View States
  const [view, setView] = useState<'list' | 'create' | 'invoice' | 'ledger'>('list');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [activeLedgerPatientId, setActiveLedgerPatientId] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [page, setPage] = useState(1);

  // Search state inside form
  const [patientSearch, setPatientSearch] = useState('');

  // Role permissions
  const isAdmin = user?.role === 'ADMIN';
  const isReceptionist = user?.role === 'RECEPTIONIST';
  const canRecordPayment = isAdmin || isReceptionist;

  // Fetch doctors & patients
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors'],
    queryFn: getDoctors,
    enabled: view !== 'list',
  });
  const doctors = doctorsData?.data || [];

  const { data: patientsData } = useQuery({
    queryKey: ['patients', patientSearch],
    queryFn: () => getPatients({ search: patientSearch, limit: 100 }),
    enabled: view !== 'list',
  });
  const patients = patientsData?.data?.patients || [];

  // Fetch payments & revenue summary
  const { data: paymentsData, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['payments', page, selectedPatientId, selectedDoctorId, selectedPaymentMethod],
    queryFn: () =>
      getPayments({
        page,
        limit: 10,
        patientId: selectedPatientId || undefined,
        doctorId: selectedDoctorId || undefined,
        paymentMethod: (selectedPaymentMethod as any) || undefined,
      }),
  });
  const paymentsList = paymentsData?.data?.payments || [];
  const revenueSummary = paymentsData?.data?.summary;
  const totalPayments = paymentsData?.data?.pagination?.total || 0;
  const totalPages = paymentsData?.data?.pagination?.totalPages || 1;

  // Fetch patient financial ledger history
  const { data: ledgerRes, isLoading: isLoadingLedger } = useQuery({
    queryKey: ['ledger', activeLedgerPatientId],
    queryFn: () => getPatientFinancial(activeLedgerPatientId!),
    enabled: !!activeLedgerPatientId && view === 'ledger',
  });
  const ledger = ledgerRes?.data;

  // React Hook Form for recording payment
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
  });

  // Create payment mutation
  const recordMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: (res) => {
      toast.success(res.message || 'Payment recorded successfully.');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setView('list');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to record payment.');
    },
  });

  const handleRecordSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      notes: values.notes || null,
      paymentDate: values.paymentDate ? new Date(values.paymentDate).toISOString() : new Date().toISOString(),
      invoiceNumber: values.invoiceNumber || undefined,
    };
    recordMutation.mutate(payload);
  };

  const handleNewPayment = () => {
    reset({
      patientId: '',
      doctorId: '',
      amount: 0,
      paymentMethod: 'Cash',
      invoiceNumber: '',
      notes: '',
      paymentDate: new Date().toISOString().substring(0, 16),
    });
    setView('create');
  };

  const handlePrint = () => {
    window.print();
  };

  // Local filter search querying titles, patient names, and doctors
  const filteredPayments = paymentsList.filter((p) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const patientName = p.patient?.fullName?.toLowerCase() || '';
    const docName = p.doctor?.name?.toLowerCase() || p.doctor?.user?.name?.toLowerCase() || '';
    const invNo = p.invoiceNumber.toLowerCase();
    return patientName.includes(query) || docName.includes(query) || invNo.includes(query);
  });

  // Styles helpers
  const getMethodBadge = (method: 'Cash' | 'Visa' | 'Insurance' | 'Wallet') => {
    switch (method) {
      case 'Cash':
        return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
      case 'Visa':
        return 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900';
      case 'Insurance':
        return 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-900';
      case 'Wallet':
        return 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* ------------------ VIEW: DIRECTORY & DASHBOARD ------------------ */}
      {view === 'list' && (
        <div className="space-y-6 flex-1 flex flex-col">
          {/* Revenue Statistics Cards */}
          {revenueSummary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Total Revenue main card */}
              <div className="lg:col-span-2 bg-gradient-to-br from-primary to-primary-container-low text-primary-foreground dark:text-inverse-primary rounded-xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider opacity-90">Total Revenue Summary</span>
                  <h3 className="text-3xl font-extrabold mt-1">
                    ${revenueSummary.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </h3>
                  <p className="text-[10px] opacity-85 mt-2">Clinic total billing transactions aggregate</p>
                </div>
                <div className="p-3 bg-white/10 rounded-lg">
                  <ArrowDownCircle size={32} />
                </div>
              </div>

              {/* Cash payment method */}
              <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Cash Method</span>
                  <h4 className="text-lg font-bold text-foreground mt-1">
                    ${Number(revenueSummary.breakdown.Cash).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </h4>
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold mt-2">Direct checkout</span>
              </div>

              {/* Visa payment method */}
              <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Visa / Card</span>
                  <h4 className="text-lg font-bold text-foreground mt-1">
                    ${Number(revenueSummary.breakdown.Visa).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </h4>
                </div>
                <span className="text-[10px] text-blue-600 font-semibold mt-2">POS Terminal</span>
              </div>

              {/* Insurance & Wallet methods */}
              <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Insurance / Claims</span>
                  <h4 className="text-lg font-bold text-foreground mt-1">
                    ${Number(revenueSummary.breakdown.Insurance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </h4>
                </div>
                <span className="text-[10px] text-purple-600 font-semibold mt-2">Co-pays & Deductibles</span>
              </div>
            </div>
          )}

          {/* Directory Toolbar Filters */}
          <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">Payments & Ledgers</h2>
              <div className="h-6 w-px bg-outline-variant hidden sm:block"></div>
              <div className="flex gap-1.5 flex-wrap">
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary shadow-sm"
                >
                  <option value="">-- All Patients --</option>
                  {paymentsList.map((p) => p.patient).filter((v, i, a) => a.findIndex(x => x?.id === v?.id) === i).map((pat) => pat && (
                    <option key={pat.id} value={pat.id}>
                      {pat.fullName}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary shadow-sm"
                >
                  <option value="">-- All Doctors --</option>
                  {paymentsList.map((p) => p.doctor).filter((v, i, a) => a.findIndex(x => x?.id === v?.id) === i).map((doc) => doc && (
                    <option key={doc.id} value={doc.id}>
                      {doc.name || doc.user?.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary shadow-sm"
                >
                  <option value="">-- All Methods --</option>
                  <option value="Cash">Cash</option>
                  <option value="Visa">Visa</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Wallet">Wallet</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
              <div className="relative flex-1 lg:flex-none">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input
                  type="text"
                  placeholder="Search invoice number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-xs w-full lg:w-48"
                />
              </div>
              {canRecordPayment && (
                <button
                  onClick={handleNewPayment}
                  className="bg-primary text-primary-foreground py-1.5 px-4 rounded-lg text-xs font-bold hover:brightness-95 transition-all shadow-sm flex items-center gap-2"
                >
                  <Plus size={14} /> Create Payment
                </button>
              )}
            </div>
          </div>

          {/* List Table */}
          <div className="flex-1 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
            {isLoadingPayments ? (
              <div className="flex-1 flex items-center justify-center flex-col gap-2 text-muted-foreground py-12">
                <Loader2 className="animate-spin w-8 h-8 text-primary" />
                <p className="text-sm font-semibold">Loading payment transactions...</p>
              </div>
            ) : (
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container-low text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="p-3 pl-4">Patient</th>
                      <th className="p-3">Invoice Number</th>
                      <th className="p-3">Doctor</th>
                      <th className="p-3">Payment Method</th>
                      <th className="p-3">Amount Paid</th>
                      <th className="p-3">Payment Date</th>
                      <th className="p-3 text-center">Ledger / Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-outline-variant text-foreground">
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-primary/5 transition-colors">
                        <td className="p-3 pl-4 font-semibold">{p.patient?.fullName}</td>
                        <td className="p-3 font-mono text-[11px] text-muted-foreground">{p.invoiceNumber}</td>
                        <td className="p-3 font-medium">{p.doctor?.name || p.doctor?.user?.name}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getMethodBadge(p.paymentMethod)}`}>
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-emerald-600">
                          ${Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(p.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-center space-x-1.5">
                          <button
                            onClick={() => {
                              setSelectedPayment(p);
                              setView('invoice');
                            }}
                            className="px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded text-[11px] transition-colors"
                          >
                            Invoice
                          </button>
                          <button
                            onClick={() => {
                              setActiveLedgerPatientId(p.patientId);
                              setView('ledger');
                            }}
                            className="px-2 py-1 bg-secondary/10 hover:bg-secondary/20 text-secondary-foreground font-semibold rounded text-[11px] transition-colors"
                          >
                            Ledger
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredPayments.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground font-semibold">
                          No billing transactions recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="p-4 border-t border-outline-variant flex justify-between items-center bg-surface-container-low">
              <span className="text-xs text-muted-foreground">
                Showing {filteredPayments.length} of {totalPayments} records
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-1 border border-outline-variant rounded bg-surface hover:bg-muted disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-semibold px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-1 border border-outline-variant rounded bg-surface hover:bg-muted disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ VIEW: PRINTABLE INVOICE SUMMARY ------------------ */}
      {view === 'invoice' && selectedPayment && (
        <div className="space-y-6 print-container">
          {/* Toolbar */}
          <div className="flex justify-between items-end border-b border-outline-variant pb-4 print:hidden">
            <div>
              <button
                onClick={() => {
                  setView('list');
                  setSelectedPayment(null);
                }}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 mb-1"
              >
                <ChevronLeft size={12} /> Back to Directory
              </button>
              <h2 className="text-xl font-bold text-foreground">Invoice Details</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold bg-surface hover:bg-surface-container-low text-foreground flex items-center gap-2 shadow-sm"
              >
                <Printer size={14} /> Print Invoice
              </button>
              <button
                onClick={() => {
                  toast.success('Downloaded invoice PDF (Mocked).');
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:brightness-95 flex items-center gap-2 shadow-sm"
              >
                Download PDF
              </button>
            </div>
          </div>

          {/* High-fidelity Printable Invoice Card */}
          <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-8 max-w-3xl mx-auto shadow-sm space-y-8">
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-outline-variant pb-6">
              <div>
                <h1 className="text-2xl font-bold text-primary dark:text-inverse-primary">DentalFlow Clinic</h1>
                <p className="text-xs text-muted-foreground mt-1">100 Clinic Medical Boulevard, Building 4B</p>
                <p className="text-xs text-muted-foreground">Phone: +1 (555) 234-9876</p>
              </div>
              <div className="text-right">
                <span className="bg-primary/10 text-primary text-xs font-mono font-bold px-2 py-0.5 rounded">
                  OFFICIAL RECEIPTS
                </span>
                <h3 className="text-lg font-mono font-bold mt-2 text-foreground">
                  {selectedPayment.invoiceNumber}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Payment Date: {new Date(selectedPayment.paymentDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Bill details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <h5 className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider mb-1">Billed Patient:</h5>
                <p className="font-bold text-foreground">{selectedPayment.patient?.fullName}</p>
                {selectedPayment.patient?.phone && (
                  <p className="text-muted-foreground mt-0.5">Phone: {selectedPayment.patient?.phone}</p>
                )}
                {selectedPayment.patient?.email && (
                  <p className="text-muted-foreground mt-0.5">Email: {selectedPayment.patient?.email}</p>
                )}
              </div>
              <div>
                <h5 className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider mb-1">Attending Doctor:</h5>
                <p className="font-semibold text-foreground">
                  {selectedPayment.doctor?.name || selectedPayment.doctor?.user?.name}
                </p>
                {selectedPayment.doctor?.specialization && (
                  <p className="text-muted-foreground mt-0.5">Specialization: {selectedPayment.doctor.specialization}</p>
                )}
              </div>
            </div>

            {/* Line items (Simulated table representing amount paid) */}
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low font-bold text-muted-foreground uppercase text-[9px] tracking-wider">
                  <th className="p-3">Description</th>
                  <th className="p-3">Payment Type</th>
                  <th className="p-3 text-right">Amount Billed</th>
                  <th className="p-3 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-foreground">
                <tr>
                  <td className="p-3 font-semibold">Dental Clinical Services / Treatments co-pay</td>
                  <td className="p-3">
                    <span className="font-bold">{selectedPayment.paymentMethod}</span>
                  </td>
                  <td className="p-3 text-right font-medium">
                    ${Number(selectedPayment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-600">
                    ${Number(selectedPayment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Terms and notes */}
            <div className="flex flex-col md:flex-row justify-between pt-4 border-t border-outline-variant gap-4 text-xs">
              <div className="flex-1">
                <h5 className="font-bold text-muted-foreground text-[10px] uppercase mb-1">Invoice Notes:</h5>
                <p className="text-muted-foreground bg-surface p-3 border border-outline-variant rounded-lg leading-relaxed italic">
                  {selectedPayment.notes || 'Transaction recorded without additional clinical notes.'}
                </p>
              </div>
              <div className="w-48 space-y-1 text-right self-end">
                <div className="flex justify-between font-semibold">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>${Number(selectedPayment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-semibold text-emerald-600 border-t pt-1 text-sm">
                  <span>Paid Total:</span>
                  <span>${Number(selectedPayment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Signature Area */}
            <div className="hidden print:flex justify-between pt-16 text-center text-xs">
              <div>
                <div className="w-40 border-b border-muted-foreground mx-auto"></div>
                <p className="mt-1 text-muted-foreground">Authorized Signature</p>
              </div>
              <div>
                <div className="w-40 border-b border-muted-foreground mx-auto"></div>
                <p className="mt-1 text-muted-foreground">Patient Signature</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ VIEW: PATIENT FINANCIAL LEDGER ------------------ */}
      {view === 'ledger' && (
        <div className="space-y-6">
          <div className="flex justify-between items-end border-b border-outline-variant pb-4">
            <div>
              <button
                onClick={() => {
                  setView('list');
                  setActiveLedgerPatientId(null);
                }}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 mb-1"
              >
                <ChevronLeft size={12} /> Back to Directory
              </button>
              <h2 className="text-xl font-bold text-foreground">Patient Financial Ledger</h2>
            </div>
            <button
              onClick={handlePrint}
              className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold bg-surface hover:bg-surface-container-low text-foreground flex items-center gap-2 shadow-sm"
            >
              <Printer size={14} /> Print Ledger
            </button>
          </div>

          {isLoadingLedger || !ledger ? (
            <div className="h-[200px] flex items-center justify-center flex-col gap-2 text-muted-foreground">
              <Loader2 className="animate-spin w-8 h-8 text-primary" />
              <p className="text-sm font-semibold">Loading ledger summaries...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Financial Ledger Aggregates Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-4 shadow-sm flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-600">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Invoiced</span>
                    <h4 className="text-lg font-bold text-foreground mt-0.5">
                      ${ledger.totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </h4>
                  </div>
                </div>

                <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-4 shadow-sm flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-600">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Paid</span>
                    <h4 className="text-lg font-bold text-foreground mt-0.5">
                      ${ledger.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </h4>
                  </div>
                </div>

                <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-4 shadow-sm flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${ledger.balance > 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Outstanding Balance</span>
                    <h4 className={`text-lg font-bold mt-0.5 ${ledger.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      ${ledger.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </h4>
                  </div>
                </div>
              </div>

              {/* Treatments vs Payments Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Invoiced Treatments List */}
                <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-foreground border-b border-outline-variant pb-2">
                    Invoiced Clinical Procedures
                  </h4>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {ledger.treatments.map((t) => (
                      <div key={t.id} className="flex justify-between items-center text-xs p-2.5 bg-surface border border-outline-variant rounded-lg">
                        <div>
                          <p className="font-bold text-foreground">{t.treatmentName}</p>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(t.sessionDate).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="font-bold text-foreground">
                          ${Number(t.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                    {ledger.treatments.length === 0 && (
                      <p className="text-xs text-muted-foreground italic text-center py-6">
                        No invoiced treatments recorded.
                      </p>
                    )}
                  </div>
                </div>

                {/* Logged Payments list */}
                <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-foreground border-b border-outline-variant pb-2">
                    Payment Transactions Log
                  </h4>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {ledger.payments.map((p) => (
                      <div key={p.id} className="flex justify-between items-center text-xs p-2.5 bg-surface border border-outline-variant rounded-lg">
                        <div>
                          <p className="font-bold text-foreground">{p.invoiceNumber}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] font-bold text-primary bg-primary/10 rounded px-1">{p.paymentMethod}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(p.paymentDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-emerald-600">
                          ${Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                    {ledger.payments.length === 0 && (
                      <p className="text-xs text-muted-foreground italic text-center py-6">
                        No recorded payment receipts.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------ VIEW: CREATE PAYMENT FORM ------------------ */}
      {view === 'create' && (
        <div className="space-y-6">
          <div className="border-b border-outline-variant pb-4">
            <button
              onClick={() => setView('list')}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 mb-1"
            >
              <ChevronLeft size={12} /> Cancel & Return
            </button>
            <h2 className="text-xl font-bold text-foreground">Record Patient Payment</h2>
          </div>

          <form onSubmit={handleSubmit(handleRecordSubmit as any)} className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-6 shadow-sm max-w-2xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Patient <span className="text-error">*</span>
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Search patient..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-full px-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xs"
                  />
                  <select
                    {...register('patientId')}
                    className="w-full px-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="">-- Select Patient --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.phone})
                      </option>
                    ))}
                  </select>
                  {errors.patientId && (
                    <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                      <AlertCircle size={11} /> {errors.patientId.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Attending Doctor <span className="text-error">*</span>
                </label>
                <select
                  {...register('doctorId')}
                  className="w-full px-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-xs h-[72px]"
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialization})
                    </option>
                  ))}
                </select>
                {errors.doctorId && (
                  <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.doctorId.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Amount Paid ($) <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('amount', { valueAsNumber: true })}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                />
                {errors.amount && (
                  <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.amount.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Payment Method <span className="text-error">*</span>
                </label>
                <select
                  {...register('paymentMethod')}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-xs"
                >
                  <option value="Cash">Cash</option>
                  <option value="Visa">Visa</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Wallet">Wallet</option>
                </select>
                {errors.paymentMethod && (
                  <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.paymentMethod.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Custom Invoice Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. INV-2026-0001 (auto-generates if empty)"
                  {...register('invoiceNumber')}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Payment Date <span className="text-error">*</span>
                </label>
                <input
                  type="datetime-local"
                  {...register('paymentDate')}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Transaction / Observation Notes
              </label>
              <textarea
                rows={3}
                placeholder="Describe transaction details (e.g. Copay, full coverage, claims notes)..."
                {...register('notes')}
                className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end pt-3">
              <button
                type="button"
                onClick={() => setView('list')}
                className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold bg-surface hover:bg-surface-container-low text-foreground transition-colors"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={recordMutation.isPending}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:brightness-95 flex items-center gap-1.5 shadow-sm"
              >
                {recordMutation.isPending ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <Save size={14} />}
                Record Payment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
