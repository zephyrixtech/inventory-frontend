import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesInvoiceService, type SalesInvoice } from '@/services/salesInvoiceService';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Printer } from "lucide-react";
import generateInvoicePDF from './InvoicePrintTemplate';
import { toast } from 'react-hot-toast';

const UaeDirhamIcon = ({ className = "inline-block h-3 w-auto align-middle", style = {} }: { className?: string, style?: React.CSSProperties }) => (
  <svg viewBox="0 0 1000 870" className={className} style={{ height: '11px', width: 'auto', display: 'inline-block', verticalAlign: 'middle', fill: 'currentColor', marginLeft: '2px', marginRight: '2px', ...style }}>
    <path d="m88.3 1c0.4 0.6 2.6 3.3 4.7 5.9 15.3 18.2 26.8 47.8 33 85.1 4.1 24.5 4.3 32.2 4.3 125.6v87h-41.8c-38.2 0-42.6-0.2-50.1-1.7-11.8-2.5-24-9.2-32.2-17.8-6.5-6.9-6.3-7.3-5.9 13.6 0.5 17.3 0.7 19.2 3.2 28.6 4 14.9 9.5 26 17.8 35.9 11.3 13.6 22.8 21.2 39.2 26.3 3.5 1 10.9 1.4 37.1 1.6l32.7 0.5v43.3 43.4l-46.1-0.3-46.3-0.3-8-3.2c-9.5-3.8-13.8-6.6-23.1-14.9l-6.8-6.1 0.4 19.1c0.5 17.7 0.6 19.7 3.1 28.7 8.7 31.8 29.7 54.5 57.4 61.9 6.9 1.9 9.6 2 38.5 2.4l30.9 0.4v89.6c0 54.1-0.3 94-0.8 100.8-0.5 6.2-2.1 17.8-3.5 25.9-6.5 37.3-18.2 65.4-35 83.6l-3.4 3.7h169.1c101.1 0 176.7-0.4 187.8-0.9 19.5-1 63-5.3 72.8-7.4 3.1-0.6 8.9-1.5 12.7-2.1 8.1-1.2 21.5-4 40.8-8.9 27.2-6.8 52-15.3 76.3-26.1 7.6-3.4 29.4-14.5 35.2-18 3.1-1.8 6.8-4 8.2-4.7 3.9-2.1 10.4-6.3 19.9-13.1 4.7-3.4 9.4-6.7 10.4-7.4 4.2-2.8 18.7-14.9 25.3-21 25.1-23.1 46.1-48.8 62.4-76.3 2.3-4 5.3-9 6.6-11.1 3.3-5.6 16.9-33.6 18.2-37.8 0.6-1.9 1.4-3.9 1.8-4.3 2.6-3.4 17.6-50.6 19.4-60.9 0.6-3.3 0.9-3.8 3.4-4.3 1.6-0.3 24.9-0.3 51.8-0.1 53.8 0.4 53.8 0.4 65.7 5.9 6.7 3.1 8.7 4.5 16.1 11.2 9.7 8.7 8.8 10.1 8.2-11.7-0.4-12.8-0.9-20.7-1.8-23.9-3.4-12.3-4.2-14.9-7.2-21.1-9.8-21.4-26.2-36.7-47.2-44l-8.2-3-33.4-0.4-33.3-0.5 0.4-11.7c0.4-15.4 0.4-45.9-0.1-61.6l-0.4-12.6 44.6-0.2c38.2-0.2 45.3 0 49.5 1.1 12.6 3.5 21.1 8.3 31.5 17.8l5.8 5.4v-14.8c0-17.6-0.9-25.4-4.5-37-7.1-23.5-21.1-41-41.1-51.8-13-7-13.8-7.2-58.5-7.5-26.2-0.2-39.9-0.6-40.6-1.2-0.6-0.6-1.1-1.6-1.1-2.4 0-0.8-1.5-7.1-3.5-13.9-23.4-82.7-67.1-148.4-131-197.1-8.7-6.7-30-20.8-38.6-25.6-3.3-1.9-6.9-3.9-7.8-4.5-4.2-2.3-28.3-14.1-34.3-16.6-3.6-1.6-8.3-3.6-10.4-4.4-35.3-15.3-94.5-29.8-139.7-34.3-7.4-0.7-17.2-1.8-21.7-2.2-20.4-2.3-48.7-2.6-209.4-2.6-135.8 0-169.9 0.3-169.4 1zm330.7 43.3c33.8 2 54.6 4.6 78.9 10.5 74.2 17.6 126.4 54.8 164.3 117 3.5 5.8 18.3 36 20.5 42.1 10.5 28.3 15.6 45.1 20.1 67.3 1.1 5.4 2.6 12.6 3.3 16 0.7 3.3 1 6.4 0.7 6.7-0.5 0.4-100.9 0.6-223.3 0.5l-222.5-0.2-0.3-128.5c-0.1-70.6 0-129.3 0.3-130.4l0.4-1.9h71.1c39 0 78 0.4 86.5 0.9zm297.5 350.3c0.7 4.3 0.7 77.3 0 80.9l-0.6 2.7-227.5-0.2-227.4-0.3-0.2-42.4c-0.2-23.3 0-42.7 0.2-43.1 0.3-0.5 97.2-0.8 227.7-0.8h227.2zm-10.2 171.7c0.5 1.5-1.9 13.8-6.8 33.8-5.6 22.5-13.2 45.2-20.9 62-3.8 8.6-13.3 27.2-15.6 30.7-1.1 1.6-4.3 6.7-7.1 11.2-18 28.2-43.7 53.9-73 72.9-10.7 6.8-32.7 18.4-38.6 20.2-1.2 0.3-2.5 0.9-3 1.3-0.7 0.6-9.8 4-20.4 7.8-19.5 6.9-56.6 14.4-86.4 17.5-19.3 1.9-22.4 2-96.7 2h-76.9v-129.7-129.8l220.9-0.4c121.5-0.2 221.6-0.5 222.4-0.7 0.9-0.1 1.8 0.5 2.1 1.2z" />
  </svg>
);

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
      currency: 'AED',
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

  const calculateTotalVat = () => {
    return invoice?.items.reduce((sum, item) => {
      const grossAmount = item.quantity * item.unitPrice;
      const discountAmount = item.discount || 0;
      const vatPercentage = item.vat || 0;
      return sum + (item.vatAmount || ((grossAmount - discountAmount) * (vatPercentage / 100)));
    }, 0) || invoice?.vatTotal || 0;
  };

  const grossTotal = calculateGrossTotal();
  // const totalDiscount = calculateTotalDiscount();
  const subtotal = calculateSubtotal();
  const tax = invoice?.taxAmount || 0;
  const totalVat = calculateTotalVat();
  const finalAmount = invoice?.netAmount || (subtotal + totalVat + tax);

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
                  <tr className="bg-gray-100 font-bold text-[11px] border-b border-black text-black">
                    <th className="border border-black p-1 text-center w-12">SI<br/>No.</th>
                    <th className="border border-black p-1 text-left">Description of Goods</th>
                    <th className="border border-black p-1 text-right w-28">Quantity</th>
                    <th className="border border-black p-1 text-right w-20">Rate</th>
                    <th className="border border-black p-1 text-center w-16">per</th>
                    <th className="border border-black p-1 text-center w-16">VAT<br/>%</th>
                    <th className="border border-black p-1 text-right w-28">Amount</th>
                    <th className="border border-black p-1 text-right w-24">VAT<br/>(<UaeDirhamIcon />)</th>
                    <th className="border border-black p-1 text-right w-32">Total<br/>Incl.VAT(<UaeDirhamIcon />)</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => {
                    const itemName = typeof item.item === 'object' && item.item !== null
                      ? item.item.name
                      : 'Unknown Item';
                    const vatVal = item.vat || 0;
                    const grossAmount = item.quantity * item.unitPrice;
                    const vatAmount = grossAmount * (vatVal / 100);
                    const netAmt = grossAmount + vatAmount;

                    return (
                      <tr key={index} className="border-b border-gray-300">
                        <td className="border-l border-r border-black p-1.5 text-center">{index + 1}</td>
                        <td className="border-l border-r border-black p-1.5 font-bold text-left">{itemName}</td>
                        <td className="border-l border-r border-black p-1.5 text-right font-normal">
                          {item.quantity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Pecs
                        </td>
                        <td className="border-l border-r border-black p-1.5 text-right font-normal">
                          {item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="border-l border-r border-black p-1.5 text-center font-normal">Pecs</td>
                        <td className="border-l border-r border-black p-1.5 text-center font-normal">{vatVal} %</td>
                        <td className="border-l border-r border-black p-1.5 text-right font-bold">
                          {grossAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="border-l border-r border-black p-1.5 text-right font-normal">
                          {vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="border-l border-r border-black p-1.5 text-right font-normal">
                          {netAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Empty Spacer Row to balance invoice look */}
                  {invoice.items.length < 8 && (
                    <tr style={{ height: `${Math.max(40, 240 - invoice.items.length * 35)}px` }}>
                      <td className="border-l border-r border-black"></td>
                      <td className="border-l border-r border-black"></td>
                      <td className="border-l border-r border-black"></td>
                      <td className="border-l border-r border-black"></td>
                      <td className="border-l border-r border-black"></td>
                      <td className="border-l border-r border-black"></td>
                      <td className="border-l border-r border-black"></td>
                      <td className="border-l border-r border-black"></td>
                      <td className="border-l border-r border-black"></td>
                    </tr>
                  )}
                  {/* Bottom box containing Chargeable/VAT words and the right-side summary */}
                  <tr className="border-t border-black">
                    {/* Left side: Amount Chargeable and VAT Amount in words */}
                    <td colSpan={3} rowSpan={3} className="border border-black p-2.5 align-top text-xs bg-white text-black">
                      <div className="space-y-4">
                        <div>
                          <span className="text-gray-600 block text-[10px]">Amount Chargeable (in words)</span>
                          <span className="font-bold text-black uppercase block mt-1 leading-snug">
                            {numberToWords(finalAmount, 'AED')} (<UaeDirhamIcon /> {finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 block text-[10px]">VAT Amount (in words)</span>
                          <span className="font-bold text-black uppercase block mt-1 leading-snug">
                            {numberToWords(totalVat, 'AED')} (<UaeDirhamIcon /> {totalVat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Right side Row 1: Taxable Value */}
                    <td colSpan={5} className="border border-black p-2 text-left font-normal text-xs bg-white text-black">
                      Taxable Value
                    </td>
                    <td className="border border-black p-2 text-right font-normal text-xs bg-white text-black">
                      {grossTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr>
                    {/* Right side Row 2: Value Added Tax 5 % */}
                    <td colSpan={5} className="border border-black p-2 text-left font-normal text-xs bg-white text-black">
                      Value Added Tax 5 %
                    </td>
                    <td className="border border-black p-2 text-right font-normal text-xs bg-white text-black">
                      {totalVat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr className="font-bold text-sm">
                    {/* Right side Row 3: Invoice Total */}
                    <td colSpan={5} className="border-t-2 border-b-2 border-l border-r border-black p-2.5 text-left bg-white text-black text-sm">
                      Invoice Total
                    </td>
                    <td className="border-t-2 border-b-2 border-l border-r border-black p-2.5 text-right bg-white text-black text-sm">
                      {finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="text-right text-[10px] italic font-normal text-gray-600 mt-1 mr-1">
                E. & O.E
              </div>
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