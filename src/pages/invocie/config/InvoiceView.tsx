import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesInvoiceService, type SalesInvoice } from '@/services/salesInvoiceService';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Printer } from "lucide-react";
import generateInvoicePDF from './InvoicePrintTemplate';
import { useAppSelector } from '@/hooks/redux';
import { toast } from 'react-hot-toast';

// Using SalesInvoice type from service

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<SalesInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userInfo = useAppSelector((state) => state.user.userData);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) {
        setError('Invoice ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await salesInvoiceService.getInvoice(id);
        
        if (response.data) {
          setInvoice(response.data);
        } else {
          setError('Invoice not found');
        }
      } catch (err: any) {
        console.error('Error fetching invoice:', err);
        setError(`Failed to fetch invoice: ${err.message || 'Unknown error'}`);
        toast.error(`Failed to fetch invoice: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case "paid":
  //       return "bg-green-100 text-green-800";
  //     case "pending":
  //       return "bg-yellow-100 text-yellow-800";
  //     case "overdue":
  //       return "bg-red-100 text-red-800";
  //     default:
  //       return "bg-gray-100 text-gray-800";
  //   }
  // };

  const handlePrint = () => {
    if (!invoice) return;

    const customerName = typeof invoice.customer === 'object' && invoice.customer !== null
      ? invoice.customer.name
      : 'N/A';
    const customerPhone = typeof invoice.customer === 'object' && invoice.customer !== null
      ? invoice.customer.phone || 'N/A'
      : 'N/A';
    // const customerEmail = typeof invoice.customer === 'object' && invoice.customer !== null
    //   ? invoice.customer.email || ''
    //   : '';

    const storeName = typeof invoice.store === 'object' && invoice.store !== null
      ? invoice.store.name
      : 'N/A';
    const storeCode = typeof invoice.store === 'object' && invoice.store !== null
      ? invoice.store.code || ''
      : '';

    const invoiceData = {
      id: invoice._id || invoice.id || '',
      invoiceNumber: invoice.invoiceNumber,
      customer: {
        name: customerName,
        contact: customerPhone,
        address: '',
      },
      store: {
        name: storeName,
        contact: storeCode,
      },
      items: invoice.items.map((item, index) => {
        const itemName = typeof item.item === 'object' && item.item !== null
          ? item.item.name
          : 'Unknown Item';
        const grossAmount = item.quantity * item.unitPrice;
        const discountAmount = item.discount || 0;
        const vatPercentage = item.vat || 0;
        const amountAfterDiscount = grossAmount - discountAmount;
        const vatAmount = amountAfterDiscount * (vatPercentage / 100);
        const netAmount = amountAfterDiscount + vatAmount;

        return {
          id: typeof item.item === 'object' && item.item !== null ? item.item._id : String(index),
          itemNumber: typeof item.item === 'object' && item.item !== null ? item.item.code || '' : '',
          name: itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: discountAmount,
          vat: vatPercentage,
          vatAmount: vatAmount,
          grossAmount: grossAmount,
          netAmount: netAmount,
        };
      }),
      date: invoice.invoiceDate,
      status: 'pending' as const,
    };

    generateInvoicePDF(invoiceData);
  };

  const calculateGrossTotal = () => {
    return invoice?.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0;
  };

  const calculateTotalDiscount = () => {
    return invoice?.items.reduce((sum, item) => sum + (item.discount || 0), 0) || invoice?.discountTotal || 0;
  };

  const calculateSubtotal = () => {
    return calculateGrossTotal() - calculateTotalDiscount();
  };

  const grossTotal = calculateGrossTotal();
  const totalDiscount = calculateTotalDiscount();
  const subtotal = calculateSubtotal();
  const tax = invoice?.taxAmount || 0;
  const finalAmount = invoice?.netAmount || (subtotal + tax);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading invoice...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
          <Card className="border-none shadow-lg">
            <CardContent className="p-6 text-center">
              <p className="text-red-600 mb-4">{error || 'Invoice not found'}</p>
              <Button onClick={() => navigate('/dashboard/invoice')} className="bg-blue-600 hover:bg-blue-700">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Invoices
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen print:p-0 print:bg-white">
      <div className="max-w-6xl mx-auto space-y-6 print:space-y-0">
        <div className="flex items-center justify-between print:hidden">
           <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.history.back()}
                      className="hover:bg-blue-100 transition-colors duration-200 rounded-full"
                    >
                      <ArrowLeft className="h-5 w-5 text-blue-600" />
                    </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>

        <Card className="border-none shadow-lg print:shadow-none print:border-none">
          <CardContent className="p-6 print:p-8">
            <div id="invoice-content" className="space-y-8 print:min-h-[29.7cm]">
              {/* Header Section */}
              <div className="flex justify-between items-start border-b border-gray-200 pb-6 print:pb-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-blue-800">{'AL LIBAS GENERAL TRADING L L C'}</h1>
                  <p className="text-gray-600">{'SHOP NO 5'}</p>
                  <p className="text-gray-600">{ 'STANDARD HOMES REAL ESTATE BUILDING'}</p>
                  <p className="text-gray-600">{ 'AJMAN'}, {'INDUSTRIAL AREA 2'}, { 'P.O.BOX :4381'}</p>
                  <p className="text-gray-600">Phone: { '+971-55-680-5858 / +971-55-918-7607'}</p>
                  {invoice.email && <p className="text-gray-600">Email: {'allibastrading@gmail.com'}</p>}
                </div>
                <div className="text-right space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                  <p className="text-gray-600">Invoice #: {invoice.invoiceNumber}</p>
                  <p className="text-gray-600">Date: {new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Bill To and Summary Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Bill To</h3>
                  <div className="border-l-4 border-blue-600 pl-4 space-y-1">
                    <p className="text-lg font-medium text-gray-800">
                      {typeof invoice.customer === 'object' && invoice.customer !== null
                        ? invoice.customer.name
                        : 'N/A'}
                    </p>
                    <p className="text-gray-600">
                      Contact: {typeof invoice.customer === 'object' && invoice.customer !== null
                        ? invoice.customer.phone || 'N/A'
                        : 'N/A'}
                    </p>
                    {typeof invoice.customer === 'object' && invoice.customer !== null && invoice.customer.email && (
                      <p className="text-gray-600">Email: {invoice.customer.email}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Invoice Summary</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Items:</span>
                      <span className="font-medium">{invoice.items.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gross Amount:</span>
                      <span className="font-medium">{grossTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Discount:</span>
                      <span className="font-medium text-green-600">-{totalDiscount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-gray-800 font-semibold">Net Amount:</span>
                      <span className="font-bold text-blue-600">{finalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-blue-50">
                      <TableRow>
                        <TableHead className="text-sm font-medium text-blue-800">Item Name</TableHead>
                        <TableHead className="text-sm font-medium text-blue-800 text-center">Qty</TableHead>
                        <TableHead className="text-sm font-medium text-blue-800 text-right">Unit Price</TableHead>
                        <TableHead className="text-sm font-medium text-blue-800 text-center">Discount</TableHead>
                        <TableHead className="text-sm font-medium text-blue-800 text-center">VAT</TableHead>
                        <TableHead className="text-sm font-medium text-blue-800 text-right">Gross Amount</TableHead>
                        <TableHead className="text-sm font-medium text-blue-800 text-right">Net Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.items.map((item, index) => {
                        const itemName = typeof item.item === 'object' && item.item !== null
                          ? item.item.name
                          : 'Unknown Item';
                        const grossAmount = item.quantity * item.unitPrice;
                        const discountAmount = item.discount || 0;
                        const discountPercentage = grossAmount > 0 ? (discountAmount / grossAmount) * 100 : 0;
                        const vatPercentage = item.vat || 0;
                        const amountAfterDiscount = grossAmount - discountAmount;
                        const vatAmount = amountAfterDiscount * (vatPercentage / 100);
                        const netAmount = amountAfterDiscount + vatAmount;

                        return (
                          <TableRow key={item.item && typeof item.item === 'object' ? item.item._id : index} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="font-medium text-gray-800">{itemName}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">{item.unitPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-center">
                              {discountPercentage > 0 ? (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                                  {discountPercentage.toFixed(2)}%
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {vatPercentage > 0 ? (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                                  {vatPercentage.toFixed(2)}%
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {grossAmount.toFixed(2)}
                              {discountAmount > 0 && (
                                <div className="text-xs text-green-600">-{discountAmount.toFixed(2)}</div>
                              )}
                              {vatAmount > 0 && (
                                <div className="text-xs text-blue-600">+{vatAmount.toFixed(2)} VAT</div>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold">{netAmount.toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end">
                <div className="w-full max-w-md">
                  <div className="bg-gray-50 p-6 rounded-lg space-y-3">
                    <div className="flex justify-between text-gray-600">
                      <span>Gross Total:</span>
                      <span>{grossTotal.toFixed(2)}</span>
                    </div>
                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Total Discount:</span>
                        <span>-{totalDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-800 font-semibold border-t pt-3">
                      <span>Subtotal:</span>
                      <span>{subtotal.toFixed(2)}</span>
                    </div>
                    {/* <div className="flex justify-between text-gray-600">
                      <span>Tax (0%):</span>
                      <span>0.00</span>
                    </div> */}
                    <div className="flex justify-between font-bold text-lg text-blue-600 border-t-2 pt-3">
                      <span>Total Amount:</span>
                      <span>{finalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Section */}
              <div className="border-t pt-6 print:pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-800">Payment Instructions</h4>
                    <p className="text-gray-600 text-sm">Please make payment via bank transfer to:</p>
                    <p className="text-gray-600 text-sm">Bank: {userInfo?.company_data?.bank_name || 'RAKBANK'}</p>
                    <p className="text-gray-600 text-sm">Account: {userInfo?.company_data?.bank_account_number || '0192594853001'}</p>
                    <p className="text-gray-600 text-sm">IBAN: {userInfo?.company_data?.iban || 'AE790400000192594853001'}</p>
                    <p className="text-gray-600 text-sm">Reference: {invoice.invoiceNumber}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-800">Terms & Conditions</h4>
                    <p className="text-gray-600 text-sm">
                      Payment is due within 30 days. Please include the invoice number as reference.
                      Late payments may incur additional charges.
                    </p>
                  </div>
                </div>
                <div className="text-center mt-6 text-gray-500 text-sm print:fixed print:bottom-0 print:left-0 print:right-0">
                  <p>Thank you for your business!</p>
                  <p>For any queries, please contact us at {userInfo?.company_data?.email || 'allibastrading@gmail.com'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}