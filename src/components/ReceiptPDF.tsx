import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ReceiptData {
  customerName: string;
  customerId: string;
  saleId: string;
  date: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  totalAmount: number;
  paymentMode: string;
  paymentDate: string;
}

export const generateReceiptPDF = async (receiptData: ReceiptData) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Add logo and header
  pdf.setFillColor(25, 25, 112);
  pdf.rect(0, 0, pageWidth, 40, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.text("SALES RECEIPT", pageWidth / 2, 20, { align: "center" });
  pdf.setFontSize(12);
  pdf.text("Official Business Receipt", pageWidth / 2, 30, { align: "center" });

  // Customer information
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(14);
  pdf.text("Customer Information:", 20, 60);
  pdf.setFontSize(10);
  pdf.text(`Name: ${receiptData.customerName}`, 20, 70);
  pdf.text(`Customer ID: ${receiptData.customerId}`, 20, 77);
  pdf.text(`Receipt #: ${receiptData.saleId}`, 20, 84);
  pdf.text(`Date: ${new Date(receiptData.date).toLocaleDateString()}`, 20, 91);

  // Items table header
  pdf.setFillColor(240, 240, 240);
  pdf.rect(20, 110, pageWidth - 40, 10, "F");
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.text("Item", 25, 117);
  pdf.text("Qty", 100, 117);
  pdf.text("Price", 130, 117);
  pdf.text("Total", 160, 117);

  // Items
  let yPos = 125;
  receiptData.items.forEach((item, index) => {
    pdf.text(item.name, 25, yPos);
    pdf.text(item.quantity.toString(), 100, yPos);
    pdf.text(`$${item.price.toFixed(2)}`, 130, yPos);
    pdf.text(`$${item.total.toFixed(2)}`, 160, yPos);
    yPos += 7;
  });

  // Total
  yPos += 10;
  pdf.setDrawColor(0, 0, 0);
  pdf.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;
  pdf.setFontSize(12);
  pdf.text("Total Amount:", 120, yPos);
  pdf.text(`$${receiptData.totalAmount.toFixed(2)}`, 160, yPos);

  // Payment information
  yPos += 15;
  pdf.text("Payment Information:", 20, yPos);
  pdf.setFontSize(10);
  yPos += 7;
  pdf.text(`Payment Mode: ${receiptData.paymentMode}`, 20, yPos);
  yPos += 7;
  pdf.text(
    `Payment Date: ${new Date(receiptData.paymentDate).toLocaleDateString()}`,
    20,
    yPos
  );

  // Footer
  const footerY = pdf.internal.pageSize.getHeight() - 20;
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text("Thank you for your business!", pageWidth / 2, footerY, {
    align: "center",
  });
  pdf.text(
    "This is an computer-generated receipt",
    pageWidth / 2,
    footerY + 5,
    { align: "center" }
  );

  // Save the PDF
  pdf.save(`receipt-${receiptData.saleId}.pdf`);
};
