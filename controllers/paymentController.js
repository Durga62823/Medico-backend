// controllers/paymentController.js
const paypal = require("../helpers/Paypal"); // PayPal SDK configured for sandbox
const Billing = require("../models/billingModel");

// ========================
// Helper: validate items and total
// ========================
const validateTotal = (billingItems, totalAmount) => {
  const sum = billingItems.reduce((acc, item) => {
    return acc + (Number(item.price) * (item.quantity || 1));
  }, 0);
  return Number(sum.toFixed(2)) === Number(totalAmount.toFixed(2));
};

// ========================
const createOrder = async (req, res) => {
  try {
    // Log the entire request body for debugging
    console.log("Received a request to create a PayPal order. Request body:", req.body);
    
    const { billingId, billingItems, totalAmount } = req.body;
    if (!billingId || !totalAmount) {
      return res.status(400).json({ success: false, message: "Billing ID and amount required" });
    }

    // Ensure CLIENT_BASE_URL is fully qualified (ngrok/public URL)
    if (!process.env.CLIENT_BASE_URL || !/^https?:\/\//.test(process.env.CLIENT_BASE_URL)) {
      return res.status(500).json({ success: false, message: "CLIENT_BASE_URL is invalid or missing" });
    }

    const create_payment_json = {
      intent: "sale",
      payer: { payment_method: "paypal" },
      redirect_urls: {
        return_url: `${process.env.CLIENT_BASE_URL}/billing/paypal-return`,
        cancel_url: `${process.env.CLIENT_BASE_URL}/billing/paypal-cancel`,
      },
      transactions: [
        {
          item_list: {
            items: billingItems.map((item) => ({
              name: item.name,
              sku: item.id || "med-service",
              price: item.price,
              currency: "USD",
              quantity: item.quantity || 1,
            })),
          },
          amount: { 
            currency: "USD", 
            total: totalAmount 
          },
          description: `Payment for MedAIron billing ${billingId}`,
        },
      ],
    };

    paypal.payment.create(create_payment_json, async (error, paymentInfo) => {
      if (error) {
        console.log("PayPal Create Order Error:", JSON.stringify(error, null, 2));
        return res.status(500).json({ success: false, message: "Error creating PayPal payment" });
      }

      // Check if paymentInfo is valid before proceeding
      if (!paymentInfo || !paymentInfo.links) {
        return res.status(500).json({ success: false, message: "Invalid paymentInfo from PayPal" });
      }

      // We'll wrap the database update in a separate try...catch
      try {
        await Billing.findByIdAndUpdate(billingId, { paymentStatus: "pending", orderDate: new Date() });
      } catch (dbError) {
        console.log("Database Update Error:", dbError);
        return res.status(500).json({ success: false, message: "Failed to update billing status in database" });
      }

      const approvalURL = paymentInfo.links.find((link) => link.rel === "approval_url")?.href;
      res.status(201).json({ success: true, approvalURL, billingId });
    });
  } catch (e) {
    console.log("Create Order Error:", e);
    res.status(500).json({ success: false, message: "Error occurred" });
  }
};




// ========================
// Capture/verify PayPal payment
// ========================
const capturePayment = async (req, res) => {
  try {
    const { billingId, paymentId, payerId } = req.body;
    if (!billingId || !paymentId || !payerId) {
      return res.status(400).json({ success: false, message: "Missing parameters" });
    }

    const billing = await Billing.findById(billingId);
    if (!billing) return res.status(404).json({ success: false, message: "Billing not found" });

    const execute_payment_json = { payer_id: payerId };
    paypal.payment.execute(paymentId, execute_payment_json, async (error, payment) => {
      if (error) {
        console.error("PayPal Capture Error:", error.response || error);
        return res.status(500).json({ success: false, message: "Error capturing PayPal payment" });
      }

      billing.paymentStatus = "paid";
      billing.orderStatus = "confirmed";
      billing.paymentId = paymentId;
      billing.payerId = payerId;
      await billing.save();

      const io = req.app.get("io");
      if (io) io.to("admins").emit("payment:success", { billingId, paymentId });

      res.status(200).json({ success: true, message: "Billing confirmed", data: billing });
    });
  } catch (e) {
    console.error("Capture Payment Error:", e);
    res.status(500).json({ success: false, message: "Error occurred" });
  }
};

// ========================
// Get all billings for a patient
// ========================
const getAllBillings = async (req, res) => {
  try {
    const { patientId } = req.params;
    const billings = await Billing.find({ patientId });
    if (!billings.length) return res.status(404).json({ success: false, message: "No billings found" });
    res.status(200).json({ success: true, message: "All billings", data: billings });
  } catch (e) {
    console.error("Get All Billings Error:", e);
    res.status(500).json({ success: false, message: "Error occurred" });
  }
};

// ========================
// Get single billing details
// ========================
const getBillingDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const billing = await Billing.findById(id);
    if (!billing) return res.status(404).json({ success: false, message: "Billing not found" });
    res.status(200).json({ success: true, message: "Billing details", data: billing });
  } catch (e) {
    console.error("Get Billing Details Error:", e);
    res.status(500).json({ success: false, message: "Error occurred" });
  }
};

// ========================
// Export all functions
// ========================
module.exports = {
  createOrder,
  capturePayment,
  getAllBillings,
  getBillingDetails,
};
