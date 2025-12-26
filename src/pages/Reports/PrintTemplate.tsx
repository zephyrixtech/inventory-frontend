import { Package } from 'lucide-react';
import type { JSX } from 'react';

interface PrintTemplateProps {
  reportData: any;
  selectedReportType: string;
  dateRange: [Date | null, Date | null];
  getStatusBadge: (status: string, type: string) => JSX.Element;
}

const PrintTemplate: React.FC<PrintTemplateProps> = ({
  reportData,
  selectedReportType,
  dateRange,
  getStatusBadge,
}) => {
  // Format date helper function
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get the data array based on report type
  const getData = () => {
    if (selectedReportType === 'purchase-order') {
      return reportData['purchase-order']?.data || [];
    }
    if (selectedReportType === 'sales') {
      return reportData['sales']?.data || [];
    }
    if (selectedReportType === 'stock') {
      return reportData['stock']?.data || [];
    }
    return [];
  };

  const data = getData();
  
  // Interface for PurchaseOrderItem from Reports.tsx
  interface PurchaseOrderItem {
    _id: string;
    itemId: string;
    itemName: string;
    description?: string;
    unitPrice: number;
    quantity: number;
    totalValue: number;
    supplier: {
      _id: string;
      name: string;
    };
    orderDate: string;
    status: string;
  }

  // Interface for SalesInvoice from Reports.tsx
  interface SalesInvoice {
    _id: string;
    invoiceNumber?: string;
    invoice_number?: string;
    invoiceDate?: string;
    invoice_date?: string;
    invoiceAmount?: number;
    invoice_amount?: number;
    discountAmount?: number;
    discount_amount?: number;
    tax_amount?: number;
    netAmount?: number;
    net_amount?: number;
    customer_name?: string;
    billing_address?: string;
    email?: string;
    contact_number?: string;
    items?: Array<{
      id: string;
      item_id: string;
      quantity: number | null;
      unit_price: number | null;
      discount_percentage: number | null;
      total: number;
      item_mgmt: {
        item_name: string;
        description?: string | null;
      };
    }>;
  }

  // Helper function to get report title
  const getReportTitle = () => {
    switch (selectedReportType) {
      case 'purchase-order':
        return 'Purchase Order Report';
      case 'sales':
        return 'Sales Invoice Report';
      case 'stock':
        return 'Stock Report';
      case 'packing-list':
        return 'Packing List Report';
      default:
        return 'Report';
    }
  };

  // Helper function to get report type label
  const getReportTypeLabel = () => {
    switch (selectedReportType) {
      case 'purchase-order':
        return 'Purchase Orders';
      case 'sales':
        return 'Sales Invoices';
      case 'stock':
        return 'Stock';
      default:
        return 'Report';
    }
  };

  // Helper function to get invoice property (handles both camelCase and snake_case)
  const getInvoiceProp = (invoice: SalesInvoice, camelCase: string, snakeCase: string) => {
    return (invoice as any)[camelCase] ?? (invoice as any)[snakeCase] ?? '';
  };

  return (
    <div className="print-template min-h-screen bg-gray-50 print:bg-white">
      <div className="max-w-[210mm] mx-auto p-6 print:p-8">
        {/* Enhanced Header Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 print:shadow-none print:border-gray-300 break-inside-avoid">
          <div className="border-b border-gray-200 px-8 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">AL LIBAS GENERAL TRADING L L C</h1>
                  <p className="text-gray-600 text-sm">SHOP NO 5, STANDARD HOMES REAL ESTATE BUILDING</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  {/* <p className="text-gray-700 text-sm font-medium">System ID</p>
                  <p className="text-gray-500 text-xs">IMS2025</p> */}
                </div>
              </div>
            </div>
          </div>
          <div className="px-8 py-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {getReportTitle()}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Report Type: {getReportTypeLabel()}
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Total Records: {data.length}
                  </span>
                </div>
              </div>
              <div className="text-left md:text-right">
                <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Date Range
                  </p>
                  <p className="text-sm font-semibold text-gray-800">
                    {dateRange[0] && dateRange[1]
                      ? `${formatDate(dateRange[0])} – ${formatDate(dateRange[1])}`
                      : 'All Time'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Order Report Content */}
        {selectedReportType === 'purchase-order' && data.length > 0 && (
          <div className="space-y-8">
            {(data as PurchaseOrderItem[]).map((currentItem: PurchaseOrderItem, index: number) => (
              <div
                key={currentItem._id || index}
                className="bg-white border border-gray-200 rounded-lg p-6 break-inside-avoid print:mb-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Purchase Order Item: {currentItem.itemId}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Supplier:</span>{' '}
                        {currentItem.supplier?.name || 'N/A'}
                      </p>
                      <p>
                        <span className="font-medium">Order Date:</span>{' '}
                        {formatDate(currentItem.orderDate)}
                      </p>
                      <p>
                        <span className="font-medium">Item Name:</span>{' '}
                        {currentItem.itemName}
                      </p>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <div className="mb-4">
                      {getStatusBadge(currentItem.status, 'purchase-order')}
                    </div>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Total Value:</span>{' '}
                        {(currentItem.totalValue || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">
                            Item ID
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">
                            Item Name
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">
                            Supplier
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-gray-700">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-right font-medium text-gray-700">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-right font-medium text-gray-700">
                            Total Value
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white">
                          <td className="px-4 py-3 font-medium">{currentItem.itemId}</td>
                          <td className="px-4 py-3">{currentItem.itemName}</td>
                          <td className="px-4 py-3">{currentItem.supplier?.name || 'N/A'}</td>
                          <td className="px-4 py-3 text-center">{currentItem.quantity || 0}</td>
                          <td className="px-4 py-3 text-right">{(currentItem.unitPrice || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-medium">
                            {(currentItem.totalValue || 0).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sales Invoice Report Content */}
        {selectedReportType === 'sales' && data.length > 0 && (
          <div className="space-y-8">
            {(data as SalesInvoice[]).map((invoice: SalesInvoice, index: number) => {
              const invoiceNumber = getInvoiceProp(invoice, 'invoiceNumber', 'invoice_number');
              const invoiceDate = getInvoiceProp(invoice, 'invoiceDate', 'invoice_date');
              const invoiceAmount = getInvoiceProp(invoice, 'invoiceAmount', 'invoice_amount') || 0;
              const discountAmount = getInvoiceProp(invoice, 'discountAmount', 'discount_amount') || 0;
              const taxAmount = invoice.tax_amount || 0;
              const netAmount = getInvoiceProp(invoice, 'netAmount', 'net_amount') || 0;

              return (
                <div
                  key={invoice._id || index}
                  className="bg-white border border-gray-200 rounded-lg p-6 break-inside-avoid print:mb-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Sales Invoice: {invoiceNumber || `INV-${index + 1}`}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="font-medium">Invoice Date:</span>{' '}
                          {invoiceDate ? formatDate(invoiceDate) : 'N/A'}
                        </p>
                        {invoice.customer_name && (
                          <p>
                            <span className="font-medium">Customer:</span>{' '}
                            {invoice.customer_name}
                          </p>
                        )}
                        {invoice.billing_address && (
                          <p>
                            <span className="font-medium">Billing Address:</span>{' '}
                            {invoice.billing_address}
                          </p>
                        )}
                        {invoice.contact_number && (
                          <p>
                            <span className="font-medium">Contact:</span>{' '}
                            {invoice.contact_number}
                          </p>
                        )}
                        {invoice.email && (
                          <p>
                            <span className="font-medium">Email:</span>{' '}
                            {invoice.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="font-medium">Gross Amount:</span>{' '}
                          {invoiceAmount.toFixed(2)}
                        </p>
                        <p>
                          <span className="font-medium">Discount:</span>{' '}
                          {discountAmount.toFixed(2)}
                        </p>
                        <p>
                          <span className="font-medium">Tax Amount:</span>{' '}
                          {taxAmount.toFixed(2)}
                        </p>
                        <p className="pt-2 border-t border-gray-200">
                          <span className="font-bold text-base">Net Amount:</span>{' '}
                          <span className="font-bold text-base text-blue-600">
                            {netAmount.toFixed(2)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">
                              Item Name
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">
                              Description
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-700">
                              Quantity
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-700">
                              Unit Price
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-700">
                              Discount %
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-700">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.items && invoice.items.length > 0 ? (
                            invoice.items.map((item, itemIndex) => (
                              <tr key={item.id || itemIndex} className="bg-white">
                                <td className="px-4 py-3 font-medium">
                                  {item.item_mgmt?.item_name || 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {item.item_mgmt?.description || '-'}
                                </td>
                                <td className="px-4 py-3 text-right">{item.quantity || 0}</td>
                                <td className="px-4 py-3 text-right">
                                  {(item.unit_price || 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {item.discount_percentage || 0}%
                                </td>
                                <td className="px-4 py-3 text-right font-medium">
                                  {(item.total || 0).toFixed(2)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-4 py-3 text-center text-gray-500">
                                No items found
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={4} className="px-4 py-3"></td>
                            <td className="px-4 py-3 text-right font-semibold">
                              Tax Amount:
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">
                              {taxAmount.toFixed(2)}
                            </td>
                          </tr>
                          <tr className="border-t-2 border-gray-300">
                            <td colSpan={4} className="px-4 py-3"></td>
                            <td className="px-4 py-3 text-right font-bold text-base">
                              Net Total:
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-base text-blue-600">
                              {netAmount.toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No Data Message */}
        {data.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-12 break-inside-avoid">
            <div className="text-gray-500">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Reports Found</h3>
              <p className="text-sm">No data available for the selected criteria.</p>
            </div>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          /* Hide non-printable elements */
          body > *:not(.print-template),
          .chatbot-icon,
          .scrollbar,
          [class*="chat"],
          [class*="sidebar"],
          [class*="nav"],
          [class*="footer"],
          [class*="header"]:not(.print-template *) {
            display: none !important;
          }

          /* Ensure print template is visible */
          .print-template {
            display: block !important;
            position: static !important;
            width: 100%;
            height: auto;
            overflow: visible !important;
          }

          body { 
            margin: 0;
            padding: 0;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            background: white !important;
          }

          .break-inside-avoid { 
            break-inside: avoid;
            page-break-inside: avoid;
          }

          @page {
            size: A4;
            margin: 5mm;
          }

          .max-w-[210mm] {
            width: 210mm !important;
            min-height: 297mm;
            box-sizing: border-box;
          }

          /* Force page break before each card except the first */
          .space-y-8 > div:not(:first-child) {
            page-break-before: always;
            margin-top: 0 !important;
          }

          /* Ensure cards don't split and have proper spacing */
          .bg-white {
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 32px !important;
            box-sizing: border-box;
          }

          /* Spacing for print */
          .space-y-8 > * + * {
            margin-top: 32px !important;
          }

          /* Table styles for print */
          table {
            border-collapse: collapse;
            width: 100%;
            table-layout: auto;
          }

          th, td {
            border: 1px solid #e5e7eb;
            padding: 3mm 2mm;
            box-sizing: border-box;
          }

          /* Ensure table content is visible */
          .overflow-x-auto, .print\\:overflow-visible {
            overflow: visible !important;
          }

          /* Status badge styles for print */
          .bg-green-100 { background-color: #dcfce7 !important; }
          .bg-yellow-100 { background-color: #fef3c7 !important; }
          .bg-red-100 { background-color: #fee2e2 !important; }
          .bg-blue-100 { background-color: #dbeafe !important; }
          .bg-gray-100 { background-color: #f3f4f6 !important; }
          .bg-gray-50 { background-color: #f9fafb !important; }

          .text-green-800 { color: #166534 !important; }
          .text-yellow-800 { color: #92400e !important; }
          .text-red-800 { color: #991b1b !important; }
          .text-blue-800 { color: #1e40af !important; }
          .text-gray-800 { color: #1f2937 !important; }
          .text-blue-600 { color: #2563eb !important; }

          .rounded-xl, .rounded-lg { border-radius: 8px !important; }
          .shadow-lg, .shadow-sm { box-shadow: none !important; }

          .bg-blue-500 { background-color: #3b82f6 !important; }
          .bg-green-500 { background-color: #10b981 !important; }
        }

        @media screen {
          .print-template {
            display: block;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintTemplate;