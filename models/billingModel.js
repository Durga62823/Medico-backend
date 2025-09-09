const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  billingItems: [{
    name: { type: String, required: true },  // e.g., 'Consultation'
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
  }],
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  orderStatus: { type: String, enum: ['pending', 'confirmed'], default: 'pending' },
  paymentId: { type: String },  // PayPal payment ID
  payerId: { type: String },    // PayPal payer ID
  orderDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Billing', billingSchema);
