// Stand-in for services/emailService so tests never load
// .env or talk to Gmail.
module.exports = {
  sendVerificationEmail: jest.fn().mockResolvedValue(),
  sendForgotPasswordEmail: jest.fn().mockResolvedValue(),
  sendChangePasswordEmail: jest.fn().mockResolvedValue(),
  sendBillReminderEmail: jest.fn().mockResolvedValue(),
  sendBudgetAlertEmail: jest.fn().mockResolvedValue(),
};
