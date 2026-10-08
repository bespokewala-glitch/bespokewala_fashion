import mongoose, { Schema } from 'mongoose';

/**
 * Invoice = immutable snapshot of an order at the moment payment is confirmed.
 * We store the computed tax lines so a later change to product prices, HSN/GST
 * defaults or seller details can never alter an invoice that was already issued.
 */

const LineSchema = new Schema(
  {
    description: { type: String, required: true },
    sku: String,
    size: String,
    hsn: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPriceInclusive: { type: Number, required: true },
    gstRate: { type: Number, required: true },
    grossTotal: { type: Number, required: true },
    taxableValue: { type: Number, required: true },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    cgstRate: { type: Number, default: 0 },
    sgstRate: { type: Number, default: 0 },
    igstRate: { type: Number, default: 0 },
  },
  { _id: false }
);

const InvoiceSchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    invoiceNumber: { type: String, required: true },
    fiscalYear: { type: String, required: true },
    sequence: { type: Number, required: true },
    issuedAt: { type: Date, required: true },

    seller: {
      legalName: String,
      tradeName: String,
      addressLines: [String],
      state: String,
      stateCode: String,
      gstin: String,
      pan: String,
      email: String,
      phone: String,
      website: String,
    },
    buyer: {
      name: String,
      email: String,
      phone: String,
      addressLines: [String],
      state: String,
      stateCode: String,
    },

    placeOfSupply: String,
    isInterState: { type: Boolean, default: false },
    lines: [LineSchema],
    totals: {
      taxableValue: Number,
      cgst: Number,
      sgst: Number,
      igst: Number,
      totalTax: Number,
      grandTotal: Number,
    },
    amountInWords: String,

    paymentMethod: String,
    razorpayOrderId: String,
    razorpayPaymentId: String,

    // Delivery bookkeeping — each channel is claimed atomically so a retry or a
    // duplicate webhook can never message the customer twice.
    delivery: {
      emailSentAt: { type: Date, default: null },
      emailTo: String,
      whatsappSentAt: { type: Date, default: null },
      whatsappTo: String,
      whatsappError: String,
    },
  },
  { timestamps: true }
);

InvoiceSchema.index({ order: 1 }, { unique: true });
InvoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ user: 1, createdAt: -1 });

/** Gap-free, per-financial-year sequence counter. */
const InvoiceCounterSchema = new Schema({
  _id: { type: String }, // fiscal year, e.g. "2026-27"
  seq: { type: Number, default: 0 },
});

export const InvoiceCounter =
  mongoose.models.InvoiceCounter || mongoose.model('InvoiceCounter', InvoiceCounterSchema);

export default mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
