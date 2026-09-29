const nodemailer = require('nodemailer');

/**
 * Nodemailer transporter — Gmail SMTP
 * Set EMAIL_USER, EMAIL_PASS, EMAIL_FROM in .env
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,   // Use Gmail App Password (not your main password)
  },
});

/**
 * Send booking confirmation email to the traveler
 * @param {Object} booking — full booking document from MongoDB
 */
async function sendBookingConfirmation(booking) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS ||
      process.env.EMAIL_USER === 'your_gmail@gmail.com') {
    console.log('📧 Email not configured — skipping confirmation email');
    return;
  }

  const {
    name, email, bookingRef, itemTitle, location,
    date, guests, pricePerPerson, serviceFee, total,
    paymentMethod, duration,
  } = booking;

  const travelDate = date
    ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'TBD';

  const paymentLabel = {
    card:   'Credit / Debit Card',
    bank:   'Bank Transfer',
    mobile: 'Mobile Banking (bKash / Nagad)',
  }[paymentMethod] || paymentMethod;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Booking Confirmation</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f7f6; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0a2e28 0%, #0c7c72 100%); padding: 40px 40px 32px; text-align: center; }
    .header svg { display: block; margin: 0 auto 12px; }
    .header h1 { color: #fff; font-size: 26px; font-weight: 700; margin: 0 0 4px; }
    .header p { color: #a7e8e3; font-size: 13px; margin: 0; }
    .badge { display: inline-block; background: #14b8a6; color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 5px 14px; border-radius: 999px; margin: 24px auto 0; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 16px; color: #1e293b; font-weight: 600; margin-bottom: 8px; }
    .subtext { font-size: 13px; color: #64748b; margin-bottom: 28px; line-height: 1.6; }
    .card { background: #f8fffe; border: 1px solid #ccf0ec; border-radius: 14px; padding: 24px 28px; margin-bottom: 24px; }
    .card-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #0c7c72; margin-bottom: 16px; }
    .row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2f5f3; }
    .row:last-child { border-bottom: none; }
    .row-label { font-size: 12px; color: #64748b; }
    .row-value { font-size: 13px; font-weight: 600; color: #1e293b; text-align: right; }
    .total-row { background: #0c7c72; border-radius: 10px; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 16px; }
    .total-label { color: #a7e8e3; font-size: 12px; font-weight: 600; }
    .total-value { color: #fff; font-size: 20px; font-weight: 800; }
    .ref-box { background: #fffbeb; border: 1.5px dashed #f59e0b; border-radius: 12px; padding: 18px 24px; text-align: center; margin-bottom: 24px; }
    .ref-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #92400e; margin-bottom: 6px; }
    .ref-code { font-size: 22px; font-weight: 800; color: #b45309; letter-spacing: 0.05em; }
    .note { background: #f0fdf4; border-left: 3px solid #22c55e; padding: 14px 18px; border-radius: 0 10px 10px 0; font-size: 12px; color: #166534; line-height: 1.6; margin-bottom: 28px; }
    .cta { text-align: center; margin-bottom: 28px; }
    .cta a { display: inline-block; background: #0c7c72; color: #fff; font-size: 13px; font-weight: 700; padding: 13px 32px; border-radius: 999px; text-decoration: none; }
    .footer { background: #f8fffe; padding: 24px 40px; text-align: center; border-top: 1px solid #e2f5f3; }
    .footer p { font-size: 11px; color: #94a3b8; margin: 0; line-height: 1.8; }
    .footer strong { color: #0c7c72; }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- Header -->
    <div class="header">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
        <path d="M4 18l5-8 4 6 3-4 4 6H4z" fill="#14b8a6"/>
      </svg>
      <h1>Booking Confirmed!</h1>
      <p>Your adventure is officially booked</p>
      <div class="badge">✓ Payment Received</div>
    </div>

    <!-- Body -->
    <div class="body">
      <p class="greeting">Hi ${name || 'Traveler'},</p>
      <p class="subtext">
        Thank you for choosing <strong>Wanderly</strong>! Your booking for 
        <strong>${itemTitle}</strong> has been confirmed. Below are your booking details.
        Our travel specialist will be in touch with you within 24 hours.
      </p>

      <!-- Booking Reference -->
      <div class="ref-box">
        <div class="ref-label">Booking Reference</div>
        <div class="ref-code">${bookingRef}</div>
      </div>

      <!-- Trip Details -->
      <div class="card">
        <div class="card-title">🌍 Trip Details</div>
        <div class="row">
          <span class="row-label">Package</span>
          <span class="row-value">${itemTitle}</span>
        </div>
        ${location ? `<div class="row">
          <span class="row-label">Destination</span>
          <span class="row-value">${location}</span>
        </div>` : ''}
        ${duration ? `<div class="row">
          <span class="row-label">Duration</span>
          <span class="row-value">${duration}</span>
        </div>` : ''}
        <div class="row">
          <span class="row-label">Travel Date</span>
          <span class="row-value">${travelDate}</span>
        </div>
        <div class="row">
          <span class="row-label">Travelers</span>
          <span class="row-value">${guests} ${guests === 1 ? 'Person' : 'People'}</span>
        </div>
      </div>

      <!-- Payment Summary -->
      <div class="card">
        <div class="card-title">💳 Payment Summary</div>
        <div class="row">
          <span class="row-label">Price per person</span>
          <span class="row-value">$${(pricePerPerson || 0).toLocaleString()}</span>
        </div>
        <div class="row">
          <span class="row-label">Subtotal (${guests} × $${(pricePerPerson || 0).toLocaleString()})</span>
          <span class="row-value">$${((pricePerPerson || 0) * guests).toLocaleString()}</span>
        </div>
        <div class="row">
          <span class="row-label">Service Fee (5%)</span>
          <span class="row-value">$${(serviceFee || 0).toLocaleString()}</span>
        </div>
        <div class="row">
          <span class="row-label">Payment Method</span>
          <span class="row-value">${paymentLabel}</span>
        </div>
        <div class="total-row">
          <span class="total-label">TOTAL PAID</span>
          <span class="total-value">$${(total || 0).toLocaleString()}</span>
        </div>
      </div>

      <!-- Note -->
      <div class="note">
        📋 <strong>Next Steps:</strong> A Wanderly travel specialist will contact you within 24 hours to 
        confirm final arrangements, share your detailed itinerary, and answer any questions. 
        Please keep your booking reference handy.
      </div>

      <!-- CTA -->
      <div class="cta">
        <a href="http://localhost:5173/packages">Browse More Packages →</a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>
        <strong>Wanderly Travel</strong><br/>
        Questions? Reply to this email or contact us at support@wanderly.com<br/>
        © ${new Date().getFullYear()} Wanderly. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || `"Wanderly Travel" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: `✅ Booking Confirmed — ${itemTitle} | Ref: ${bookingRef}`,
    html,
  });

  console.log(`📧 Confirmation email sent to ${email}`);
}

module.exports = { sendBookingConfirmation };
