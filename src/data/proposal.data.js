const { yearsAgo } = require('../utils/dates');

/**
 * Test data for the Health Proposal Form (TC-HF*).
 * Only dummy values: nothing here belongs to a real customer.
 */
module.exports = {
  fakeProposalId: '00000000-0000-0000-0000-000000000000',
  validBasic: {
    firstName: 'Autotest',
    lastName: 'User',
    gender: 'Male',
    dob: { day: 15, month: 6, year: 1990 },
    mobile: '9876543210',
    email: 'autotest@example.com',
    address: 'Flat 12, Test Building',
    pincode: '400001',
    maritalStatus: 'Married',
    education: 'Graduate',
  },
  validBank: { name: 'HDFC Bank', accountNo: '50100012345678', ifsc: 'HDFC0001234' },
  invalidBank: { name: '@@@123', accountNo: '1', ifsc: 'abc' },
  validKyc: { occupation: 'salaried_private', income: '10-25' },
  unusualKyc: { occupation: 'student', income: '>25' },
  validNominee: {
    name: 'Nominee Test',
    relationship: 'spouse',
    dob: { day: 10, month: 3, year: 1992 },
    mobile: '9876500000',
  },
  minorNomineeDob: { day: 15, month: 12, year: 2008 }, // 17 years old in Nov 2026
  invalidNomineeMobile: '987#$%1234',
  underageProposerDob: () => yearsAgo(0, -1), // yesterday: age 0
  addressMultiLine: ['Flat 12, Test Building', 'Line two'],
  ifscPattern: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  // Fields in the verify API that should not be returned without login (TC-HF09)
  piiFields: [
    'proposer_first_name', 'proposer_last_name', 'proposer_mobile_number', 'proposer_email',
    'proposer_address', 'proposer_date_of_birth', 'proposer_nominee_name', 'proposer_nominee_dob',
    'proposer_bank_account_no', 'proposer_existing_illnesses', 'insured_members',
  ],
  // Values that look like placeholders rather than real customer data (TC-HF04)
  placeholderNominee: { relationship: 'others', dob: '01-01-2000' },
};
