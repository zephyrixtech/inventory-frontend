import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesInvoiceService, type SalesInvoice } from '@/services/salesInvoiceService';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Printer } from "lucide-react";
import generateInvoicePDF from './InvoicePrintTemplate';
import { toast } from 'react-hot-toast';

// Using SalesInvoice type from service

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<SalesInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const customerAddress = typeof invoice.customer === 'object' && invoice.customer !== null
      ? invoice.customer.billingAddress || ''
      : '';
    const customerTrn = typeof invoice.customer === 'object' && invoice.customer !== null
      ? invoice.customer.taxNumber || ''
      : '';

    const storeName = typeof invoice.store === 'object' && invoice.store !== null
      ? invoice.store.name
      : 'N/A';
    const storeCode = typeof invoice.store === 'object' && invoice.store !== null
      ? invoice.store.code || ''
      : '';
    const storeAddress = typeof invoice.store === 'object' && invoice.store !== null ? invoice.store.address : undefined;
    const storeCity = typeof invoice.store === 'object' && invoice.store !== null ? invoice.store.city : undefined;
    const storeState = typeof invoice.store === 'object' && invoice.store !== null ? invoice.store.state : undefined;
    const storeCountry = typeof invoice.store === 'object' && invoice.store !== null ? invoice.store.country : undefined;
    const storePhone = typeof invoice.store === 'object' && invoice.store !== null ? invoice.store.phone : undefined;
    const storeEmail = typeof invoice.store === 'object' && invoice.store !== null ? invoice.store.email : undefined;
    const storeBankName = typeof invoice.store === 'object' && invoice.store !== null ? invoice.store.bankName : undefined;
    const storeBankAccountNumber = typeof invoice.store === 'object' && invoice.store !== null ? invoice.store.bankAccountNumber : undefined;
    const storeIfscCode = typeof invoice.store === 'object' && invoice.store !== null ? invoice.store.ifscCode : undefined;
    const storeIbanCode = typeof invoice.store === 'object' && invoice.store !== null ? invoice.store.ibanCode : undefined;
    const storeTaxCode = typeof invoice.store === 'object' && invoice.store !== null ? invoice.store.taxCode : undefined;

    const invoiceData = {
      id: invoice._id || invoice.id || '',
      invoiceNumber: invoice.invoiceNumber,
      customer: {
        name: customerName,
        contact: customerPhone,
        address: customerAddress,
        trn: customerTrn,
      },
      store: {
        name: storeName,
        contact: storeCode,
        address: storeAddress,
        city: storeCity,
        state: storeState,
        country: storeCountry,
        phone: storePhone,
        email: storeEmail,
        bankName: storeBankName,
        bankAccountNumber: storeBankAccountNumber,
        ifscCode: storeIfscCode,
        ibanCode: storeIbanCode,
        taxCode: storeTaxCode,
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
    return 0; // invoice?.items.reduce((sum, item) => sum + (item.discount || 0), 0) || invoice?.discountTotal || 0;
  };

  const calculateSubtotal = () => {
    return calculateGrossTotal() - calculateTotalDiscount();
  };

  const grossTotal = calculateGrossTotal();
  // const totalDiscount = calculateTotalDiscount();
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

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      const day = d.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const year = String(d.getFullYear()).slice(-2);
      return `${day}-${month}-${year}`;
    } catch (e) {
      return dateString;
    }
  };

  const numberToWords = (num: number, currency: string = 'AED'): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertLessThanOneThousand = (n: number): string => {
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convertLessThanOneThousand(n % 100) : '');
    };

    const convert = (n: number): string => {
      if (n === 0) return 'Zero';

      let words = '';

      // Millions
      const millions = Math.floor(n / 1000000);
      if (millions > 0) {
        words += convertLessThanOneThousand(millions) + ' Million ';
        n %= 1000000;
      }

      // Thousands
      const thousands = Math.floor(n / 1000);
      if (thousands > 0) {
        words += convertLessThanOneThousand(thousands) + ' Thousand ';
        n %= 1000;
      }

      // Hundreds
      if (n > 0) {
        words += convertLessThanOneThousand(n);
      }

      return words.trim();
    };

    const parts = num.toFixed(2).split('.');
    const whole = parseInt(parts[0]);
    const decimal = parseInt(parts[1]);

    let result = '';
    if (currency === 'INR') {
      result += 'Indian Rupees ' + convert(whole);
      if (decimal > 0) {
        result += ' and ' + convert(decimal) + ' Paise';
      }
    } else {
      result += 'UAE Dirhams ' + convert(whole);
      if (decimal > 0) {
        result += ' and ' + convert(decimal) + ' Fils';
      }
    }
    return result + ' Only';
  };

  const customerName = typeof invoice.customer === 'object' && invoice.customer !== null
    ? invoice.customer.name
    : 'N/A';
  const customerPhone = typeof invoice.customer === 'object' && invoice.customer !== null
    ? invoice.customer.phone || 'N/A'
    : 'N/A';
  const customerAddress = typeof invoice.customer === 'object' && invoice.customer !== null
    ? invoice.customer.billingAddress || ''
    : '';
  const customerTrn = typeof invoice.customer === 'object' && invoice.customer !== null
    ? invoice.customer.taxNumber || ''
    : '';

  const storeName = "AL LIBAS GENERAL TRADING L L C";
  const storeAddress = "NEW IND. AREA 2, BANGLA MARKET MAT FASHION BUILDING, SHOP NO.3 AJMAN, UAE";
  const storePhone = "+971-55-680-5858 / +971-55-918-7607";
  const storeEmail = "allibastrading@gmail.com";
  const storeTaxCode = "100062819600003";
  const storeCity = "Ajman";
  const storeCountry = "UAE";

  // Bank details fields
  const bankName = "RAKBANK";
  const bankAccountName = "AL LIBAS GENERAL TRADING L L C";
  const bankAccountNumber = "0192594853001";
  const bankIban = "AE790400000192594853001";
  const bankSwift = "NRAKAEAK";

  const getLogoMainText = (name: string) => {
    const upper = name.toUpperCase();
    if (upper.includes('LIBAS')) return 'AL LIBAS';
    if (upper.includes('CASECADE') || upper.includes('CASCADE')) return 'CASECADE';
    const parts = name.split(' ');
    return parts[0] || name;
  };

  const getLogoSubText = (name: string) => {
    const upper = name.toUpperCase();
    if (upper.includes('LIBAS')) return 'GENERAL TRADING L L C';
    if (upper.includes('CASECADE') || upper.includes('CASCADE')) return 'COMPUTER TRADING';
    const parts = name.split(' ');
    return parts.slice(1).join(' ') || '';
  };

  const getArabicMainText = (name: string) => {
    const upper = name.toUpperCase();
    if (upper.includes('LIBAS')) return 'ال لباس';
    if (upper.includes('CASECADE') || upper.includes('CASCADE')) return 'كـاسـكـيـد';
    return '';
  };

  const getArabicSubText = (name: string) => {
    const upper = name.toUpperCase();
    if (upper.includes('LIBAS')) return 'للتجارة العامة ش.ذ.م.م';
    if (upper.includes('CASECADE') || upper.includes('CASCADE')) return 'لتجارة الكمبيوتر';
    return '';
  };

  const showComputerBrands = storeName.toUpperCase().includes('COMPUTER') || storeName.toUpperCase().includes('CASECADE');

  const totalQty = invoice.items.reduce((sum, item) => sum + item.quantity, 0);
  const amountInWords = numberToWords(finalAmount, 'AED');

  return (
    <div className="p-6 bg-gray-100 min-h-screen print:p-0 print:bg-white flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-6 print:space-y-0">
        {/* Navigation/Actions Header */}
        <div className="flex items-center justify-between print:hidden w-full bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="hover:bg-gray-100 transition-colors duration-200 rounded-full"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-[#c22026] hover:bg-[#a81b20] text-white shadow-md transition-all duration-200 flex items-center gap-2 px-5 py-2 rounded-lg"
          >
            <Printer className="h-4.5 w-4.5" />
            Print Invoice
          </Button>
        </div>

        {/* Invoice Page Visual Container */}
        <Card className="border border-gray-300 shadow-2xl bg-white print:shadow-none print:border-none w-full min-h-[29.7cm] p-8 md:p-12 print:p-0 flex flex-col justify-between font-sans text-black">
          <CardContent className="p-0 flex flex-col gap-6">
            {/* Logo and Branding Header */}
            <div className="flex justify-between items-center border-b-3 border-[#c22026] pb-4">
              <div className="flex-1">
                <div className="text-3xl font-extrabold text-[#c22026] tracking-tight leading-none" style={{ fontFamily: 'Arial Black, sans-serif' }}>
                  {getLogoMainText(storeName)}
                </div>
                <div className="text-xs font-bold text-gray-600 tracking-widest mt-1">
                  {getLogoSubText(storeName)}
                </div>
              </div>
              <div className="flex-initial px-4">
                <svg width="48" height="48" viewBox="0 0 100 100" className="mx-auto">
                  <circle cx="50" cy="50" r="40" stroke="#c22026" strokeWidth="8.5" fill="none" strokeDasharray="210 50" transform="rotate(-40 50 50)" />
                  <circle cx="50" cy="50" r="26" stroke="#c22026" strokeWidth="4" fill="none" strokeOpacity="0.35" />
                </svg>
              </div>
              <div className="flex-1 text-right">
                <div className="text-3xl font-bold text-[#c22026] leading-none">
                  {getArabicMainText(storeName)}
                </div>
                <div className="text-xs font-bold text-gray-600 mt-1">
                  {getArabicSubText(storeName)}
                </div>
              </div>
            </div>

            {/* Invoice metadata bar */}
            <div className="flex justify-between text-xs font-bold px-1 text-gray-800">
              <div>Invoice No. <span className="font-normal text-black">{invoice.invoiceNumber}</span></div>
              <div>Dated <span className="font-normal text-black">{formatDate(invoice.invoiceDate)}</span></div>
            </div>

            {/* Store centered address */}
            <div className="text-center text-xs text-gray-800 leading-relaxed max-w-xl mx-auto space-y-0.5">
              <div className="text-sm font-bold text-black">{storeName}</div>
              <div>{storeAddress}</div>
              <div>{storePhone}</div>
              <div>Emirate : {storeCity} | Country : {storeCountry}</div>
              <div>TRN : {storeTaxCode}</div>
              <div>E-Mail : {storeEmail}</div>
            </div>

            {/* Title: Tax Invoice */}
            <div className="text-center text-base font-bold uppercase tracking-wider text-black mt-2">
              Tax Invoice
            </div>

            {/* Party details box */}
            <div className="border-t border-b border-black py-3 px-2 text-xs space-y-1">
              <div className="flex">
                <div className="w-20 font-bold text-gray-700">Party :</div>
                <div className="font-bold text-black uppercase">{customerName}</div>
              </div>
              <div className="flex">
                <div className="w-20 font-bold text-gray-700">Contact :</div>
                <div className="text-black">{customerPhone || "-"}</div>
              </div>
              <div className="flex">
                <div className="w-20 font-bold text-gray-700">Address :</div>
                <div className="text-black">{customerAddress || "-"}</div>
              </div>
              {customerTrn && (
                <div className="flex">
                  <div className="w-20 font-bold text-gray-700">TRN :</div>
                  <div className="font-bold text-black">{customerTrn}</div>
                </div>
              )}
            </div>

            {/* Table Items */}
            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="bg-gray-100 font-bold text-[11px]">
                    <th className="border border-black p-1 text-center w-12">#Sl No</th>
                    <th className="border border-black p-1 text-left">Item Name</th>
                    <th className="border border-black p-1 text-center w-16">Qty</th>
                    <th className="border border-black p-1 text-right w-24">Unit Price</th>
                    <th className="border border-black p-1 text-right w-28">Gross Amount</th>
                    {/* <th className="border border-black p-1 text-center w-20">Discount</th> */}
                    <th className="border border-black p-1 text-center w-20">VAT</th>
                    <th className="border border-black p-1 text-right w-32">Net Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => {
                    const itemName = typeof item.item === 'object' && item.item !== null
                      ? item.item.name
                      : 'Unknown Item';
                    const vatVal = item.vat || 0;
                    const grossAmount = item.quantity * item.unitPrice;
                    const discountAmount = item.discount || 0;
                    const vatDisplay = vatVal > 0 ? `${vatVal}%` : '-';
                    const netAmt = item.totalPrice || ((grossAmount - discountAmount) * (1 + vatVal / 100));

                    return (
                      <tr key={index} className="border-b border-gray-300">
                        <td className="border-l border-r border-black p-1.5 text-center">{index + 1}</td>
                        <td className="border-l border-r border-black p-1.5 font-bold">{itemName}</td>
                        <td className="border-l border-r border-black p-1.5 text-center font-bold">{item.quantity}</td>
                        <td className="border-l border-r border-black p-1.5 text-right">{item.unitPrice.toFixed(2)}</td>
                        <td className="border-l border-r border-black p-1.5 text-right font-bold">{grossAmount.toFixed(2)}</td>
                        {/* <td className="border-l border-r border-black p-1.5 text-center text-green-600 font-semibold">
                          {discountAmount > 0 ? discountAmount.toFixed(2) : '-'}
                        </td> */}
                        <td className="border-l border-r border-black p-1.5 text-center text-blue-600">{vatDisplay}</td>
                        <td className="border-l border-r border-black p-1.5 text-right font-bold">{netAmt.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  {/* Empty Spacer Rows to balance invoice look */}
                  {[...Array(Math.max(0, 5 - invoice.items.length))].map((_, i) => (
                    <tr key={`spacer-${i}`} className="h-6 border-b border-gray-200 opacity-20">
                      <td className="border-l border-r border-black"></td>
                      <td className="border-l border-r border-black"></td>
                      <td className="border-l border-r border-black"></td>
                      <td className="border-l border-r border-black"></td>
                      <td className="border-l border-r border-black"></td>
                      {/* <td className="border-l border-r border-black"></td> */}
                      <td className="border-l border-r border-black"></td>
                      <td className="border-l border-r border-black"></td>
                    </tr>
                  ))}
                  {/* Total summary row */}
                  <tr className="border-t border-b border-black font-bold bg-gray-50">
                    <td colSpan={2} className="border-l border-r border-black p-2 text-right">Total</td>
                    <td className="border-l border-r border-black p-2 text-center font-bold">{totalQty}</td>
                    <td className="border-l border-r border-black p-2"></td>
                    <td className="border-l border-r border-black p-2 text-right font-bold">{grossTotal.toFixed(2)}</td>
                    {/* <td className="border-l border-r border-black p-2 text-center text-green-600 font-bold">-{totalDiscount.toFixed(2)}</td> */}
                    <td className="border-l border-r border-black p-2"></td>
                    <td className="border-l border-r border-black p-2 text-right font-bold text-[#c22026]">Dhs {finalAmount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Amount chargeable words box */}
            <div className="border border-black p-2 flex justify-between bg-gray-50 text-xs">
              <div>
                <span className="text-gray-600 block text-[10px]">Amount Chargeable (in words)</span>
                <span className="font-bold uppercase text-black">{amountInWords}</span>
              </div>
              <div className="self-end text-[10px] italic font-normal text-gray-500">E. & O.E</div>
            </div>

            {/* Bank details and stamp bottom section */}
            <div className="flex flex-col md:flex-row justify-between gap-6 mt-4">
              <div className="flex-1 max-w-lg space-y-3">
                <div className="text-xs space-y-1">
                  <h4 className="font-bold underline text-black">Company's Bank Details</h4>
                  <div className="flex">
                    <div className="w-36 text-gray-600">A/c Holder's Name :</div>
                    <div className="font-bold text-black">{bankAccountName}</div>
                  </div>
                  <div className="flex">
                    <div className="w-36 text-gray-600">Bank Name :</div>
                    <div className="text-black">{bankName}</div>
                  </div>
                  <div className="flex">
                    <div className="w-36 text-gray-600">A/c No. :</div>
                    <div className="font-bold text-black tracking-wider">{bankAccountNumber}</div>
                  </div>
                  <div className="flex">
                    <div className="w-36 text-gray-600">IBAN :</div>
                    <div className="font-bold text-black tracking-wider">{bankIban}</div>
                  </div>
                  <div className="flex">
                    <div className="w-36 text-gray-600">Branch & SWIFT Code :</div>
                    <div className="text-black">{bankSwift}</div>
                  </div>
                </div>

                {/* Declaration */}
                <div className="text-[10px] text-gray-600 leading-relaxed pt-2">
                  <h5 className="font-bold underline text-black mb-0.5">Declaration</h5>
                  We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                </div>
              </div>

              {/* Stamp Sign block */}
              <div className="flex flex-col items-center md:items-end justify-between min-w-[220px]">
                <div className="text-xs font-bold text-black text-center md:text-right">
                  for {storeName}
                </div>

                {/* Blank Space for Physical Seal/Signature */}
                <div className="h-16"></div>

                <div className="text-xs font-bold text-black pt-4">
                  Authorised Signatory
                </div>
              </div>
            </div>
          </CardContent>

          {/* Footer Address and Brands bar */}
          <div className="border-t border-[#c22026] pt-4 mt-8 flex flex-col items-center text-center gap-1.5">
            <div className="text-[10px] font-bold text-gray-600">
              This is a Computer Generated Invoice
            </div>
            <div className="text-[10px] text-gray-700">
              Tel./Mob.: {storePhone} | Email : {storeEmail}
            </div>
            <div className="text-[10px] text-[#c22026] font-bold">
              Office : {storeAddress}
            </div>

            {/* Brands grid */}
            {showComputerBrands && (
              <div className="w-full border-t border-gray-200 mt-2 pt-2 flex justify-between items-center text-[9px] font-black text-gray-400 tracking-wider select-none px-4">
                <span className="text-[#d32f2f] hover:opacity-85 transition-opacity">HIKVISION</span>
                <span className="text-[#1e3a8a] hover:opacity-85 transition-opacity">HiLook</span>
                <span className="text-[#0284c7] hover:opacity-85 transition-opacity">GRANDSTREAM</span>
                <span className="text-[#f59e0b] hover:opacity-85 transition-opacity">EZVIZ</span>
                <span className="text-black hover:opacity-85 transition-opacity">ZEBRA</span>
                <span className="text-[#0284c7] hover:opacity-85 transition-opacity">DELL</span>
                <span className="text-black hover:opacity-85 transition-opacity">hp</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}