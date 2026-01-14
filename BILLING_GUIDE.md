# Billing System Guide

Complete guide to the billing and subscription system for MedSurveillance.

## Pricing Model

### Per-Branch Subscription

**Monthly Subscription:** R6,500 per branch per month
- Unlimited patients
- Unlimited staff users
- All clinical tests
- Certificate generation
- Employer portal access
- Advanced reporting
- 24/7 support

**One-time Setup Fee:** R8,500 per branch
- Staff training & onboarding
- Custom clinic branding
- Workflow customization
- Medical forms configuration
- Employer dashboard setup
- Data migration assistance
- Custom report templates
- Dedicated setup support

### Example Pricing

**1 Branch:**
- Setup: R8,500 (once-off)
- Monthly: R6,500/month

**2 Branches:**
- Setup: R17,000 (once-off)
- Monthly: R13,000/month

**3 Branches:**
- Setup: R25,500 (once-off)
- Monthly: R19,500/month

## Payment Flow

### Initial Setup

1. Clinic signs up and creates account
2. Adds first branch
3. Pays setup fee (R8,500) via Paystack
4. 14-day free trial begins
5. After trial, monthly subscription starts

### Adding New Branches

1. Navigate to Billing → Add Branch
2. Fill in branch details
3. Pay setup fee for new branch
4. Monthly subscription increases by R6,500
5. New branch is immediately active

### Monthly Billing

- Automatic renewal via Paystack subscription
- Charged on the same day each month
- Email receipt sent automatically
- Downloadable invoices available
- Failed payments trigger grace period

## Paystack Integration

### Setup

1. Create Paystack account at [paystack.com](https://paystack.com)
2. Get API keys from Settings → API Keys & Webhooks
3. Add keys to environment variables:
   \`\`\`bash
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx
   PAYSTACK_SECRET_KEY=sk_test_xxx
   \`\`\`

### Test Cards

Use these cards for testing:

**Successful Payment:**
- Card: 4084 0840 8408 4081
- CVV: Any 3 digits
- Expiry: Any future date
- PIN: 0000

**Failed Payment:**
- Card: 5060 6666 6666 6666
- CVV: Any 3 digits
- Expiry: Any future date
- PIN: 0000

### Going Live

1. Complete Paystack business verification
2. Get live API keys (pk_live_ and sk_live_)
3. Update environment variables with live keys
4. Test thoroughly before announcing
5. Monitor transactions in Paystack dashboard

## Database Tables

### subscription_plans
- Stores available subscription plans
- Default: "standard" plan at R6,500/month

### branch_subscriptions
- Tracks subscription for each branch
- Links to branch_id
- Contains Paystack subscription code
- Status: active, trial, cancelled, suspended, expired

### payments
- Records all payment transactions
- Links to branch_subscription
- Contains Paystack reference
- Types: subscription, setup_fee, invoice

### usage_tracking
- Tracks monthly usage per branch
- Patients registered
- Appointments created
- Tests performed
- Certificates issued
- Storage used

## Admin Functions

### For Super Admin

**View All Subscriptions:**
- See all clinic subscriptions
- Monitor payment status
- Identify at-risk accounts

**Manage Plans:**
- Update pricing (reflected in new subscriptions)
- Create custom enterprise plans
- Apply discounts

### For Clinic Admin

**Manage Subscriptions:**
- View branch subscriptions
- Add new branches
- Update payment methods
- Download invoices

**View Usage:**
- Current month statistics
- Historical usage data
- Export reports

## Webhooks

Paystack sends webhooks for:
- `charge.success` - Payment successful
- `subscription.create` - New subscription
- `subscription.disable` - Subscription cancelled
- `invoice.create` - New invoice generated

Configure webhook URL in Paystack:
\`\`\`
https://your-domain.com/api/paystack/webhook
\`\`\`

## Troubleshooting

### Payment Failed

1. Check card details are correct
2. Ensure sufficient funds
3. Try different payment method
4. Contact Paystack support

### Subscription Not Active

1. Verify payment was successful
2. Check Paystack dashboard
3. Review webhook logs
4. Contact support with reference number

### Adding Branch Failed

1. Verify setup fee payment
2. Check branch details are unique
3. Review error messages
4. Contact support if issue persists

## Support

For billing support:
- Email: billing@medsurvaillance.com
- Phone: 011 123 4567
- Hours: Mon-Fri 8am-5pm SAST

For Paystack issues:
- Email: support@paystack.com
- Phone: Listed on Paystack website
- Dashboard: dashboard.paystack.com
