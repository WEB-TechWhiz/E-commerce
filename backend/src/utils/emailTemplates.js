/**
 * Email templates for transactional emails
 */

/**
 * Welcome email template
 * @param {String} userName - User's name
 * @returns {Object} { subject, html }
 */
export const welcomeEmail = (userName) => ({
  subject: 'Welcome to Our Store!',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Our Store!</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Thank you for joining us! We're excited to have you on board.</p>
          <p>Start exploring our amazing products and enjoy exclusive deals.</p>
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/products" class="button">Browse Products</a>
          </p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Happy shopping!</p>
        </div>
      </div>
    </body>
    </html>
  `,
});

/**
 * Order confirmation email template
 * @param {String} userName - User's name
 * @param {String} orderId - Order ID
 * @param {Number} totalAmount - Total order amount
 * @param {Array} items - Order items
 * @returns {Object} { subject, html }
 */
export const orderConfirmationEmail = (userName, orderId, totalAmount, items) => ({
  subject: `Order Confirmation - #${orderId}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #2196F3; color: white; }
        .total { font-weight: bold; font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed!</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Thank you for your order! Your order <strong>#${orderId}</strong> has been confirmed.</p>
          
          <h3>Order Summary:</h3>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.price.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <p class="total">Total: $${totalAmount.toFixed(2)}</p>
          
          <p>We'll send you another email when your order ships.</p>
          <p>Track your order status <a href="${process.env.FRONTEND_URL}/orders/${orderId}">here</a>.</p>
        </div>
      </div>
    </body>
    </html>
  `,
});

/**
 * Password reset email template
 * @param {String} userName - User's name
 * @param {String} resetToken - Reset token
 * @returns {Object} { subject, html }
 */
export const passwordResetEmail = (userName, resetToken) => ({
  subject: 'Password Reset Request',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FF5722; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 10px 20px; background-color: #FF5722; color: white; text-decoration: none; border-radius: 5px; }
        .warning { color: #d32f2f; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}" class="button">Reset Password</a>
          </p>
          <p>This link will expire in 1 hour.</p>
          <p class="warning">If you didn't request a password reset, please ignore this email or contact support.</p>
        </div>
      </div>
    </body>
    </html>
  `,
});

/**
 * Order shipped email template
 * @param {String} userName - User's name
 * @param {String} orderId - Order ID
 * @param {String} trackingNumber - Shipping tracking number
 * @returns {Object} { subject, html }
 */
export const orderShippedEmail = (userName, orderId, trackingNumber) => ({
  subject: `Your Order #${orderId} Has Shipped!`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .tracking { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Order Has Shipped!</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Great news! Your order <strong>#${orderId}</strong> has been shipped and is on its way.</p>
          
          <div class="tracking">
            <strong>Tracking Number:</strong> ${trackingNumber}
          </div>
          
          <p>You can track your package using the tracking number above.</p>
          <p>Expected delivery: 3-5 business days</p>
        </div>
      </div>
    </body>
    </html>
  `,
});

/**
 * Generic notification email template
 * @param {String} userName - User's name
 * @param {String} title - Email title
 * @param {String} message - Email message
 * @returns {Object} { subject, html }
 */
export const notificationEmail = (userName, title, message) => ({
  subject: title,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #607D8B; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>${message}</p>
        </div>
      </div>
    </body>
    </html>
  `,
});
