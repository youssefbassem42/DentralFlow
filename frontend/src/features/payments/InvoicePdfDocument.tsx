import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Payment } from './types';

interface InvoicePdfDocumentProps {
  payment: Payment;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#121c2a',
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#d9e3f6',
    paddingBottom: 20,
    marginBottom: 20,
  },
  clinicName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#006492',
    marginBottom: 4,
  },
  clinicAddress: {
    fontSize: 9,
    color: '#3f4850',
    lineHeight: 1.3,
  },
  receiptBadge: {
    backgroundColor: '#eaf1ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  receiptBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#006492',
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  invoiceDate: {
    fontSize: 8,
    color: '#3f4850',
    marginTop: 4,
    textAlign: 'right',
  },
  billingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  billingCol: {
    width: '48%',
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#3f4850',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  billingName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#121c2a',
    marginBottom: 3,
  },
  billingDetail: {
    fontSize: 9,
    color: '#3f4850',
    lineHeight: 1.3,
  },
  table: {
    width: '100%',
    marginBottom: 25,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9ff',
    borderBottomWidth: 1,
    borderBottomColor: '#d9e3f6',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eaf1ff',
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  colDesc: { width: '50%' },
  colType: { width: '18%' },
  colAmountBilled: { width: '16%', textAlign: 'right' },
  colAmountPaid: { width: '16%', textAlign: 'right' },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#3f4850',
  },
  tableCellText: {
    fontSize: 9,
  },
  tableCellTextBold: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  tableCellAmountPaid: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#006a62',
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  notesContainer: {
    width: '55%',
    backgroundColor: '#f8f9ff',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eaf1ff',
  },
  notesTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#3f4850',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 8.5,
    color: '#3f4850',
    lineHeight: 1.3,
    fontStyle: 'italic',
  },
  summaryContainer: {
    width: '35%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#3f4850',
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#d9e3f6',
    paddingVertical: 5,
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#006a62',
  },
  totalValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#006a62',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 60,
  },
  signatureBox: {
    width: '40%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#d9e3f6',
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#3f4850',
  },
});

export function InvoicePdfDocument({ payment }: InvoicePdfDocumentProps) {
  const doctorName = payment.doctor?.name || payment.doctor?.user?.name || 'N/A';
  const amountFormatted = Number(payment.amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <Document title={`Invoice-${payment.invoiceNumber}`}>
      <Page size="A4" style={styles.page}>
        {/* Header Container */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.clinicName}>DentalFlow Clinic</Text>
            <Text style={styles.clinicAddress}>100 Clinic Medical Boulevard, Building 4B</Text>
            <Text style={styles.clinicAddress}>Phone: +1 (555) 234-9876</Text>
          </View>
          <View>
            <View style={styles.receiptBadge}>
              <Text style={styles.receiptBadgeText}>OFFICIAL RECEIPT</Text>
            </View>
            <Text style={styles.invoiceNumber}>{payment.invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>
              Payment Date: {new Date(payment.paymentDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Billing Information */}
        <View style={styles.billingContainer}>
          <View style={styles.billingCol}>
            <Text style={styles.sectionTitle}>Billed Patient:</Text>
            <Text style={styles.billingName}>{payment.patient?.fullName || 'N/A'}</Text>
            {payment.patient?.phone && (
              <Text style={styles.billingDetail}>Phone: {payment.patient.phone}</Text>
            )}
            {payment.patient?.email && (
              <Text style={styles.billingDetail}>Email: {payment.patient.email}</Text>
            )}
          </View>
          <View style={styles.billingCol}>
            <Text style={styles.sectionTitle}>Attending Doctor:</Text>
            <Text style={styles.billingName}>{doctorName}</Text>
            {payment.doctor?.specialization && (
              <Text style={styles.billingDetail}>
                Specialization: {payment.doctor.specialization}
              </Text>
            )}
          </View>
        </View>

        {/* Invoice Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colDesc}>
              <Text style={styles.tableHeaderText}>Description</Text>
            </View>
            <View style={styles.colType}>
              <Text style={styles.tableHeaderText}>Payment Type</Text>
            </View>
            <View style={styles.colAmountBilled}>
              <Text style={[styles.tableHeaderText, { textAlign: 'right' }]}>Amount Billed</Text>
            </View>
            <View style={styles.colAmountPaid}>
              <Text style={[styles.tableHeaderText, { textAlign: 'right' }]}>Amount Paid</Text>
            </View>
          </View>

          <View style={styles.tableRow}>
            <View style={styles.colDesc}>
              <Text style={styles.tableCellTextBold}>
                Dental Clinical Services / Treatments co-pay
              </Text>
            </View>
            <View style={styles.colType}>
              <Text style={styles.tableCellText}>{payment.paymentMethod}</Text>
            </View>
            <View style={styles.colAmountBilled}>
              <Text style={[styles.tableCellText, { textAlign: 'right' }]}>
                ${amountFormatted}
              </Text>
            </View>
            <View style={styles.colAmountPaid}>
              <Text style={[styles.tableCellAmountPaid, { textAlign: 'right' }]}>
                ${amountFormatted}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>Invoice Notes:</Text>
            <Text style={styles.notesText}>
              {payment.notes || 'Transaction recorded without additional clinical notes.'}
            </Text>
          </View>

          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>${amountFormatted}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Paid Total:</Text>
              <Text style={styles.totalValue}>${amountFormatted}</Text>
            </View>
          </View>
        </View>

        {/* Signature Area */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Authorized Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Patient Signature</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
