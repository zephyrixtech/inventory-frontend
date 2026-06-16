import { format } from 'date-fns';

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

const generateInvoicePDF = (data: InvoiceData) => {
  const formattedDate = format(new Date(data.date), 'd-MMM-yy');

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
          
          .header-center {
            flex: 0 0 80px;
            display: flex;
            justify-content: center;
          }
          
          .header-right {
            flex: 1;
            text-align: right;
          }
          
          .header-right .brand-name-ar {
            font-size: 30px;
            font-weight: bold;
            color: #c22026;
            direction: rtl;
            line-height: 0.95;
          }
          
          .header-right .brand-sub-ar {
            font-size: 13px;
            font-weight: bold;
            color: #444;
            direction: rtl;
            margin-top: 3px;
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
            <div class="header-center">
              <svg width="48" height="48" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#c22026" stroke-width="8.5" fill="none" stroke-dasharray="210 50" transform="rotate(-40 50 50)" />
                <circle cx="50" cy="50" r="26" stroke="#c22026" stroke-width="4" fill="none" stroke-opacity="0.35" />
              </svg>
            </div>
            <div class="header-right">
              <div class="brand-name-ar">${getArabicMainText(storeName)}</div>
              <div class="brand-sub-ar">${getArabicSubText(storeName)}</div>
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
                <th style="width: 95px; text-align: right;">VAT<br/>(AED)</th>
                <th style="width: 125px; text-align: right;">Total<br/>Incl.VAT(AED)</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
              ${spacerRow}
              <!-- Bottom box containing Chargeable/VAT words and the right-side summary -->
              <tr style="border-top: 1.5px solid #000;">
                <!-- Left side: Amount Chargeable and VAT Amount in words -->
                <td colspan="3" rowspan="3" style="border: 1px solid #000; padding: 10px; vertical-align: top; background-color: #fff; text-align: left;">
                  <div style="margin-bottom: 15px;">
                    <span style="font-size: 9px; color: #555; display: block;">Amount Chargeable (in words)</span>
                    <span style="font-weight: bold; text-transform: uppercase; font-size: 10.5px; display: block; margin-top: 3px; line-height: 1.35; color: #000;">
                      ${amountInWords} (AED ${formatNumber(totalNet)})
                    </span>
                  </div>
                  <div>
                    <span style="font-size: 9px; color: #555; display: block;">VAT Amount (in words)</span>
                    <span style="font-weight: bold; text-transform: uppercase; font-size: 10.5px; display: block; margin-top: 3px; line-height: 1.35; color: #000;">
                      ${numberToWords(totalVat, data.currency)} (AED ${formatNumber(totalVat)})
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

  // Wait for content to load before printing
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

export default generateInvoicePDF;
