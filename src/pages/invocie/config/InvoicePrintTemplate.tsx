import { format } from 'date-fns';

const uaeDirhamSvg = `<svg viewBox="0 0 1000 870" style="height: 10px; width: auto; display: inline-block; vertical-align: middle; fill: #000; margin-left: 2px; margin-right: 2px;"><path d="m88.3 1c0.4 0.6 2.6 3.3 4.7 5.9 15.3 18.2 26.8 47.8 33 85.1 4.1 24.5 4.3 32.2 4.3 125.6v87h-41.8c-38.2 0-42.6-0.2-50.1-1.7-11.8-2.5-24-9.2-32.2-17.8-6.5-6.9-6.3-7.3-5.9 13.6 0.5 17.3 0.7 19.2 3.2 28.6 4 14.9 9.5 26 17.8 35.9 11.3 13.6 22.8 21.2 39.2 26.3 3.5 1 10.9 1.4 37.1 1.6l32.7 0.5v43.3 43.4l-46.1-0.3-46.3-0.3-8-3.2c-9.5-3.8-13.8-6.6-23.1-14.9l-6.8-6.1 0.4 19.1c0.5 17.7 0.6 19.7 3.1 28.7 8.7 31.8 29.7 54.5 57.4 61.9 6.9 1.9 9.6 2 38.5 2.4l30.9 0.4v89.6c0 54.1-0.3 94-0.8 100.8-0.5 6.2-2.1 17.8-3.5 25.9-6.5 37.3-18.2 65.4-35 83.6l-3.4 3.7h169.1c101.1 0 176.7-0.4 187.8-0.9 19.5-1 63-5.3 72.8-7.4 3.1-0.6 8.9-1.5 12.7-2.1 8.1-1.2 21.5-4 40.8-8.9 27.2-6.8 52-15.3 76.3-26.1 7.6-3.4 29.4-14.5 35.2-18 3.1-1.8 6.8-4 8.2-4.7 3.9-2.1 10.4-6.3 19.9-13.1 4.7-3.4 9.4-6.7 10.4-7.4 4.2-2.8 18.7-14.9 25.3-21 25.1-23.1 46.1-48.8 62.4-76.3 2.3-4 5.3-9 6.6-11.1 3.3-5.6 16.9-33.6 18.2-37.8 0.6-1.9 1.4-3.9 1.8-4.3 2.6-3.4 17.6-50.6 19.4-60.9 0.6-3.3 0.9-3.8 3.4-4.3 1.6-0.3 24.9-0.3 51.8-0.1 53.8 0.4 53.8 0.4 65.7 5.9 6.7 3.1 8.7 4.5 16.1 11.2 9.7 8.7 8.8 10.1 8.2-11.7-0.4-12.8-0.9-20.7-1.8-23.9-3.4-12.3-4.2-14.9-7.2-21.1-9.8-21.4-26.2-36.7-47.2-44l-8.2-3-33.4-0.4-33.3-0.5 0.4-11.7c0.4-15.4 0.4-45.9-0.1-61.6l-0.4-12.6 44.6-0.2c38.2-0.2 45.3 0 49.5 1.1 12.6 3.5 21.1 8.3 31.5 17.8l5.8 5.4v-14.8c0-17.6-0.9-25.4-4.5-37-7.1-23.5-21.1-41-41.1-51.8-13-7-13.8-7.2-58.5-7.5-26.2-0.2-39.9-0.6-40.6-1.2-0.6-0.6-1.1-1.6-1.1-2.4 0-0.8-1.5-7.1-3.5-13.9-23.4-82.7-67.1-148.4-131-197.1-8.7-6.7-30-20.8-38.6-25.6-3.3-1.9-6.9-3.9-7.8-4.5-4.2-2.3-28.3-14.1-34.3-16.6-3.6-1.6-8.3-3.6-10.4-4.4-35.3-15.3-94.5-29.8-139.7-34.3-7.4-0.7-17.2-1.8-21.7-2.2-20.4-2.3-48.7-2.6-209.4-2.6-135.8 0-169.9 0.3-169.4 1zm330.7 43.3c33.8 2 54.6 4.6 78.9 10.5 74.2 17.6 126.4 54.8 164.3 117 3.5 5.8 18.3 36 20.5 42.1 10.5 28.3 15.6 45.1 20.1 67.3 1.1 5.4 2.6 12.6 3.3 16 0.7 3.3 1 6.4 0.7 6.7-0.5 0.4-100.9 0.6-223.3 0.5l-222.5-0.2-0.3-128.5c-0.1-70.6 0-129.3 0.3-130.4l0.4-1.9h71.1c39 0 78 0.4 86.5 0.9zm297.5 350.3c0.7 4.3 0.7 77.3 0 80.9l-0.6 2.7-227.5-0.2-227.4-0.3-0.2-42.4c-0.2-23.3 0-42.7 0.2-43.1 0.3-0.5 97.2-0.8 227.7-0.8h227.2zm-10.2 171.7c0.5 1.5-1.9 13.8-6.8 33.8-5.6 22.5-13.2 45.2-20.9 62-3.8 8.6-13.3 27.2-15.6 30.7-1.1 1.6-4.3 6.7-7.1 11.2-18 28.2-43.7 53.9-73 72.9-10.7 6.8-32.7 18.4-38.6 20.2-1.2 0.3-2.5 0.9-3 1.3-0.7 0.6-9.8 4-20.4 7.8-19.5 6.9-56.6 14.4-86.4 17.5-19.3 1.9-22.4 2-96.7 2h-76.9v-129.7-129.8l220.9-0.4c121.5-0.2 221.6-0.5 222.4-0.7 0.9-0.1 1.8 0.5 2.1 1.2z"/></svg>`;

interface InvoiceItem {
  id: string;
  itemNumber: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  vat: number;
  vatAmount: number;
  grossAmount: number;
  netAmount: number;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  date: string;
  customer: {
    name: string;
    contact: string;
    address: string;
    trn?: string;
  };
  store: {
    name: string;
    contact: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
    email?: string;
    bankName?: string;
    bankAccountNumber?: string;
    ifscCode?: string;
    ibanCode?: string;
    taxCode?: string;
  };
  items: InvoiceItem[];
  status: "paid" | "pending" | "overdue";
  currency?: string;
}

const formatNumber = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? "0.00" : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

const generateInvoicePDF = (data: InvoiceData, action: 'print' | 'download' = 'print') => {
  const formattedDate = format(new Date(data.date), 'd-MMM-yy');

  // Dynamic layout variables to fit single page precisely when items are <= 8
  const isSinglePage = data.items.length <= 8;
  const containerHeight = isSinglePage ? '295mm' : 'auto';
  const footerPosition = isSinglePage ? 'absolute' : 'relative';
  const footerBottom = isSinglePage ? '15mm' : 'auto';
  const footerLeftRight = isSinglePage ? '15mm' : '0';
  const footerMarginTop = isSinglePage ? '0' : '40px';
  const containerOverflow = isSinglePage ? 'overflow: hidden !important;' : '';

  // Calculate Totals
  const totalQty = data.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalBeforeVat = data.items.reduce((sum, item) => sum + item.grossAmount, 0);
  const totalVat = data.items.reduce((sum, item) => sum + item.vatAmount, 0);
  // const totalDiscount = data.items.reduce((sum, item) => sum + item.discount, 0);
  const totalNet = data.items.reduce((sum, item) => sum + item.netAmount, 0);

  // Store details (AL LIBAS GENERAL TRADING L L C)
  const storeName = "AL LIBAS GENERAL TRADING L L C";
  const storeAddress = "NEW IND. AREA 2, BANGLA MARKET MAT FASHION BUILDING, SHOP NO.3 AJMAN, UAE";
  const storePhone = "+971-55-680-5858 / +971-55-918-7607";
  const storeEmail = "allibastrading@gmail.com";
  const storeTaxCode = "100062819600003";
  const storeCity = "Ajman";
  const storeCountry = "UAE";

  // Bank details
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



  const showComputerBrands = storeName.toUpperCase().includes('COMPUTER') || storeName.toUpperCase().includes('CASECADE');

  const amountInWords = numberToWords(totalNet, data.currency);

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const itemRows = data.items.map((item, index) => {
    return `
    <tr class="item-row">
      <td class="text-center">${index + 1}</td>
      <td class="item-name" style="font-weight: bold; text-align: left;">${item.name}</td>
      <td class="text-right">${formatNumber(item.quantity)} Pecs</td>
      <td class="text-right">${formatNumber(item.unitPrice)}</td>
      <td class="text-center">Pecs</td>
      <td class="text-center">${item.vat} %</td>
      <td class="text-right font-bold">${formatNumber(item.grossAmount)}</td>
      <td class="text-right">${formatNumber(item.vatAmount)}</td>
      <td class="text-right">${formatNumber(item.netAmount)}</td>
    </tr>
  `;
  }).join('');

  const spacerRowHeight = Math.max(40, 240 - data.items.length * 35);
  const spacerRow = data.items.length < 8 ? `
    <tr style="height: ${spacerRowHeight}px;">
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
  ` : '';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice #${data.invoiceNumber}</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
        <script>
          window.onload = function() {
            setTimeout(function() {
              if ("${action}" === "download") {
                // Add stylesheet for PDF download mode to enforce exact layout dimensions
                const style = document.createElement('style');
                style.innerHTML = \`
                  body {
                    margin: 0 !important;
                    padding: 0 !important;
                    background-color: #fff !important;
                  }
                  .invoice-container {
                    width: 210mm !important;
                    height: ${containerHeight} !important;
                    padding: 15mm 15mm 20mm 15mm !important;
                    position: relative !important;
                    box-sizing: border-box !important;
                    box-shadow: none !important;
                    ${containerOverflow}
                  }
                  .footer-section {
                    position: ${footerPosition} !important;
                    bottom: ${footerBottom} !important;
                    left: ${footerLeftRight} !important;
                    right: ${footerLeftRight} !important;
                    margin-top: ${footerMarginTop} !important;
                  }
                \`;
                document.head.appendChild(style);

                const element = document.querySelector('.invoice-container');
                const opt = {
                  margin: 0,
                  filename: 'Invoice_${data.invoiceNumber}.pdf',
                  image: { type: 'jpeg', quality: 0.98 },
                  html2canvas: { scale: 2, useCORS: true },
                  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                if (window.html2pdf) {
                  window.html2pdf().set(opt).from(element).save().then(function() {
                    setTimeout(function() { window.close(); }, 1000);
                  }).catch(function(err) {
                    console.error(err);
                    window.close();
                  });
                } else {
                  window.print();
                  window.close();
                }
              } else {
                window.print();
                window.close();
              }
            }, 300);
          };
        </script>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          
          * {
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #000;
            line-height: 1.3;
            font-size: 11px;
          }
          
          .invoice-container {
            max-width: 100%;
            margin: 0 auto;
            position: relative;
            padding-bottom: 80px; /* Space for brand logos */
          }
          
          /* Header */
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #c22026;
            padding-bottom: 12px;
            margin-bottom: 8px;
          }
          
          .header-left {
            flex: 1;
          }
          
          .header-left .brand-name {
            font-size: 30px;
            font-weight: 900;
            color: #c22026;
            font-family: 'Arial Black', Impact, sans-serif;
            letter-spacing: 0.5px;
            line-height: 0.95;
          }
          
          .header-left .brand-sub {
            font-size: 13px;
            font-weight: 700;
            color: #444;
            letter-spacing: 1.5px;
            margin-top: 3px;
          }
          
          .header-right {
            flex: 1;
            text-align: right;
          }
          
          /* Invoice metadata bar */
          .metadata-bar {
            display: flex;
            justify-content: space-between;
            font-size: 11.5px;
            font-weight: bold;
            margin-bottom: 6px;
            padding: 0 4px;
          }
          
          /* Centered Store Address */
          .store-address-box {
            text-align: center;
            font-size: 11px;
            line-height: 1.35;
            margin-bottom: 12px;
            color: #222;
          }
          
          .store-address-box .store-title {
            font-size: 13.5px;
            font-weight: bold;
            color: #000;
            margin-bottom: 2px;
          }
          
          /* Tax Invoice title */
          .tax-invoice-title {
            text-align: center;
            font-size: 15px;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          /* Party details section */
          .party-details {
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 8px 6px;
            margin-bottom: 12px;
            line-height: 1.45;
          }
          
          .party-row {
            display: flex;
            margin-bottom: 3px;
          }
          
          .party-row:last-child {
            margin-bottom: 0;
          }
          
          .party-label {
            width: 90px;
            font-weight: bold;
          }
          
          .party-val {
            font-weight: normal;
          }
          
          .party-val.bold {
            font-weight: bold;
          }
          
          /* Main Items Table */
          .items-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            margin-bottom: 0px;
          }
          
          .items-table th {
            border: 1px solid #000;
            padding: 5px 3px;
            font-weight: bold;
            font-size: 10.5px;
            text-align: center;
            background-color: #f5f5f5;
          }
          
          .items-table td {
            border-left: 1px solid #000;
            border-right: 1px solid #000;
            padding: 5px 4px;
            vertical-align: middle;
            font-size: 10px;
          }
          
          .items-table tr.item-row {
            border-bottom: 1px dashed #ccc;
          }
          
          .items-table tr.total-row {
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            font-weight: bold;
            background-color: #fafafa;
          }
          
          .items-table tr.total-row td {
            font-size: 10.5px;
            padding: 6px 4px;
          }
          
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .item-name { font-weight: bold; }
          
          /* Chargeable box */
          .chargeable-box {
            border: 1px solid #000;
            border-top: none;
            padding: 5px;
            display: flex;
            justify-content: space-between;
            font-size: 10.5px;
            font-weight: bold;
            background-color: #fafafa;
            margin-bottom: 15px;
          }
          
          /* Bank & stamp block */
          .bottom-block {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
          }
          
          .bank-details-box {
            width: 55%;
            line-height: 1.4;
          }
          
          .bank-details-box h4 {
            margin: 0 0 4px 0;
            font-size: 11px;
            font-weight: bold;
            text-decoration: underline;
          }
          
          .bank-row {
            display: flex;
            margin-bottom: 2px;
          }
          
          .bank-label {
            width: 130px;
          }
          
          .declaration-box {
            margin-top: 12px;
            font-size: 9px;
            color: #222;
          }
          
          .declaration-box h5 {
            margin: 0 0 2px 0;
            font-weight: bold;
            text-decoration: underline;
          }
          
          .stamp-sign-box {
            width: 40%;
            text-align: right;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }
          
          .stamp-sign-box .sign-for {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          /* Graphic double blue border stamp */
          .blue-stamp {
            border: 4px double #1e3a8a;
            border-radius: 4px;
            padding: 8px 12px;
            text-align: center;
            width: 200px;
            color: #1e3a8a;
            font-family: Arial, sans-serif;
            font-weight: bold;
            background-color: rgba(30, 58, 138, 0.02);
            transform: rotate(-3deg);
            margin: 10px 0;
            box-shadow: 0 0 1px rgba(30, 58, 138, 0.2);
          }
          
          .blue-stamp .stamp-title-ar {
            font-size: 11px;
          }
          
          .blue-stamp .stamp-title-en {
            font-size: 10px;
            margin-top: 2px;
          }
          
          .blue-stamp .stamp-loc {
            font-size: 8px;
            font-weight: normal;
            margin-top: 2px;
          }
          
          .sign-authorised {
            font-size: 10px;
            font-weight: bold;
            margin-top: auto;
            padding-top: 5px;
          }
          
          /* Footer contact */
          .footer-section {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            border-top: 1.5px solid #c22026;
            padding-top: 6px;
            text-align: center;
            background-color: #fff;
          }
          
          .footer-gen-text {
            font-size: 9px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          
          .footer-contact-bar {
            font-size: 9px;
            color: #333;
            margin-bottom: 2px;
          }
          
          .footer-address {
            font-size: 9px;
            color: #e21a22;
            font-weight: bold;
            margin-bottom: 6px;
          }
          
          /* Footer Brands Grid */
          .brands-grid {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 10px;
            border-top: 1px solid #ccc;
            font-size: 8px;
            font-weight: 800;
            color: #777;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .brand-logo-text {
            font-family: 'Arial Black', sans-serif;
          }
          
          .brand-hik { color: #d32f2f; }
          .brand-hilook { color: #1e3a8a; }
          .brand-grand { color: #0284c7; }
          .brand-ezviz { color: #f59e0b; }
          .brand-zebra { color: #000000; }
          .brand-dell { color: #0284c7; }
          .brand-hp { color: #000000; }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .invoice-container {
              padding-bottom: 0;
            }
            .footer-section {
              position: fixed;
              bottom: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header -->
          <div class="header-container">
            <div class="header-left">
              <div class="brand-name">${getLogoMainText(storeName)}</div>
              <div class="brand-sub">${getLogoSubText(storeName)}</div>
            </div>
            <div class="header-right">
              <svg width="48" height="48" viewBox="0 0 100 100" style="display: inline-block; vertical-align: middle;">
                <circle cx="50" cy="50" r="40" stroke="#c22026" stroke-width="8.5" fill="none" stroke-dasharray="210 50" transform="rotate(-40 50 50)" />
                <circle cx="50" cy="50" r="26" stroke="#c22026" stroke-width="4" fill="none" stroke-opacity="0.35" />
              </svg>
            </div>
          </div>
          
          <!-- Invoice No & Date -->
          <div class="metadata-bar">
            <div>Invoice No. ${data.invoiceNumber}</div>
            <div>Dated ${formattedDate}</div>
          </div>
          
          <!-- Store address center -->
          <div class="store-address-box">
            <div class="store-title">${storeName}</div>
            <div>${storeAddress}</div>
            <div>${storePhone}</div>
            <div>Emirate : ${storeCity} | Country : ${storeCountry}</div>
            <div>TRN : ${storeTaxCode}</div>
            <div>E-Mail : ${storeEmail}</div>
          </div>
          
          <!-- Tax Invoice title -->
          <div class="tax-invoice-title">Tax Invoice</div>
          
          <!-- Party Details -->
          <div class="party-details">
            <div class="party-row">
              <div class="party-label">Party :</div>
              <div class="party-val bold">${data.customer.name.toUpperCase()}</div>
            </div>
            <div class="party-row">
              <div class="party-label">Contact :</div>
              <div class="party-val">${data.customer.contact || "-"}</div>
            </div>
            <div class="party-row">
              <div class="party-label">Address :</div>
              <div class="party-val">${data.customer.address || "-"}</div>
            </div>
            ${data.customer.trn ? `
            <div class="party-row">
              <div class="party-label">TRN :</div>
              <div class="party-val bold">${data.customer.trn}</div>
            </div>
            ` : ''}
          </div>
          
          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">SI<br/>No.</th>
                <th style="text-align: left;">Description of Goods</th>
                <th style="width: 110px; text-align: right;">Quantity</th>
                <th style="width: 80px; text-align: right;">Rate</th>
                <th style="width: 60px; text-align: center;">per</th>
                <th style="width: 60px; text-align: center;">VAT<br/>%</th>
                <th style="width: 110px; text-align: right;">Amount</th>
                <th style="width: 95px; text-align: right;">VAT<br/>(${uaeDirhamSvg})</th>
                <th style="width: 125px; text-align: right;">Total<br/>Incl.VAT(${uaeDirhamSvg})</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
              ${spacerRow}
              <!-- Total Row -->
              <tr class="total-row" style="border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; font-weight: bold;">
                <td class="text-center"></td>
                <td style="text-align: left; font-weight: bold;">Total</td>
                <td class="text-right font-bold">${formatNumber(totalQty)} Pecs</td>
                <td class="text-right"></td>
                <td class="text-center"></td>
                <td class="text-center"></td>
                <td class="text-right font-bold">${formatNumber(totalBeforeVat)}</td>
                <td class="text-right font-bold">${formatNumber(totalVat)}</td>
                <td class="text-right font-bold">${formatNumber(totalNet)}</td>
              </tr>
              <!-- Bottom box containing Chargeable/VAT words and the right-side summary -->
              <tr style="border-top: 1.5px solid #000;">
                <!-- Left side: Amount Chargeable and VAT Amount in words -->
                <td colspan="3" rowspan="3" style="border: 1px solid #000; padding: 10px; vertical-align: top; background-color: #fff; text-align: left;">
                  <div style="margin-bottom: 15px;">
                    <span style="font-size: 9px; color: #555; display: block;">Amount Chargeable (in words)</span>
                    <span style="font-weight: bold; text-transform: uppercase; font-size: 10.5px; display: block; margin-top: 3px; line-height: 1.35; color: #000;">
                      ${amountInWords} (${uaeDirhamSvg} ${formatNumber(totalNet)})
                    </span>
                  </div>
                  <div>
                    <span style="font-size: 9px; color: #555; display: block;">VAT Amount (in words)</span>
                    <span style="font-weight: bold; text-transform: uppercase; font-size: 10.5px; display: block; margin-top: 3px; line-height: 1.35; color: #000;">
                      ${numberToWords(totalVat, data.currency)} (${uaeDirhamSvg} ${formatNumber(totalVat)})
                    </span>
                  </div>
                </td>

                <!-- Right side Row 1: Taxable Value -->
                <td colspan="5" style="border: 1px solid #000; padding: 8px; text-align: left; font-size: 10px; background-color: #fff; font-weight: normal; color: #000;">
                  Taxable Value
                </td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right; font-size: 10px; background-color: #fff; font-weight: normal; color: #000;">
                  ${formatNumber(totalBeforeVat)}
                </td>
              </tr>

              <tr>
                <!-- Right side Row 2: Value Added Tax 5 % -->
                <td colspan="5" style="border: 1px solid #000; padding: 8px; text-align: left; font-size: 10px; background-color: #fff; font-weight: normal; color: #000;">
                  Value Added Tax 5 %
                </td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right; font-size: 10px; background-color: #fff; font-weight: normal; color: #000;">
                  ${formatNumber(totalVat)}
                </td>
              </tr>

              <tr style="font-weight: bold;">
                <!-- Right side Row 3: Invoice Total -->
                <td colspan="5" style="border: 1px solid #000; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 10px 8px; text-align: left; font-size: 11px; background-color: #fff; color: #000;">
                  Invoice Total
                </td>
                <td style="border: 1px solid #000; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 10px 8px; text-align: right; font-size: 11px; background-color: #fff; color: #000;">
                  ${formatNumber(totalNet)}
                </td>
              </tr>
            </tbody>
          </table>
          <div style="text-align: right; font-size: 9px; font-style: italic; margin-top: 4px; padding-right: 4px; color: #555;">
            E. & O.E
          </div>
          
          <!-- Bank & Signature area -->
          <div class="bottom-block">
            <div class="bank-details-box">
              <h4>Company's Bank Details</h4>
              <div class="bank-row">
                <div class="bank-label">A/c Holder's Name :</div>
                <div style="font-weight: bold;">${bankAccountName}</div>
              </div>
              <div class="bank-row">
                <div class="bank-label">Bank Name :</div>
                <div>${bankName}</div>
              </div>
              <div class="bank-row">
                <div class="bank-label">A/c No. :</div>
                <div style="font-weight: bold; letter-spacing: 0.5px;">${bankAccountNumber}</div>
              </div>
              <div class="bank-row">
                <div class="bank-label">IBAN :</div>
                <div style="font-weight: bold; letter-spacing: 0.5px;">${bankIban}</div>
              </div>
              <div class="bank-row">
                <div class="bank-label">Branch & SWIFT Code :</div>
                <div>${bankSwift}</div>
              </div>
              
              <!-- Declaration -->
              <div class="declaration-box">
                <h5>Declaration</h5>
                <div>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
              </div>
            </div>
            
            <div class="stamp-sign-box">
              <div class="sign-for">for ${storeName}</div>
              <div style="height: 60px;"></div>
              <div class="sign-authorised">Authorised Signatory</div>
            </div>
          </div>
          
          <!-- Footer bottom -->
          <div class="footer-section">
            <div class="footer-gen-text">This is a Computer Generated Invoice</div>
            <div class="footer-contact-bar">
              Tel./Mob.: ${storePhone} | Email : ${storeEmail}
            </div>
            <div class="footer-address">
              Office : ${storeAddress}
            </div>
            
            ${showComputerBrands ? `
            <!-- Brand Logos grid footer -->
            <div class="brands-grid">
              <span class="brand-logo-text brand-hik">HIKVISION</span>
              <span class="brand-logo-text brand-hilook">HiLook</span>
              <span class="brand-logo-text brand-grand">GRANDSTREAM</span>
              <span class="brand-logo-text brand-ezviz">EZVIZ</span>
              <span class="brand-logo-text brand-zebra">ZEBRA</span>
              <span class="brand-logo-text brand-dell">DELL</span>
              <span class="brand-logo-text brand-hp">hp</span>
            </div>
            ` : ''}
          </div>
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
};

export default generateInvoicePDF;
