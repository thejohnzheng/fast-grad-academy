const key = process.env.STRIPE_SECRET_KEY;

if (!key) {
  console.error('BLOCKED: STRIPE_SECRET_KEY is not set. Provide a Stripe sk_test_ key in the environment.');
  process.exit(1);
}

if (!key.startsWith('sk_test_')) {
  console.error('BLOCKED: STRIPE_SECRET_KEY must be a test-mode sk_test_ key. Refusing to run against live Stripe.');
  process.exit(1);
}

const { default: Stripe } = await import('stripe');
const stripe = Stripe(key);

function addDays(epochSeconds, days) {
  return epochSeconds + (days * 86400);
}

async function waitForClock(clockId, timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const clock = await stripe.testHelpers.testClocks.retrieve(clockId);
    if (clock.status === 'ready') return clock;
    if (clock.status === 'internal_failure') throw new Error('Test clock internal_failure');
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error('Test clock did not reach "ready" within timeout');
}

async function verify3PayCap() {
  console.log('=== FGA-STRIPE-01 Test-Clock Verification ===\n');

  const start = Math.floor(Date.now() / 1000);

  const clock = await stripe.testHelpers.testClocks.create({
    frozen_time: start,
    name: 'FGA 3-pay cap test',
  });
  console.log(`Test clock: ${clock.id}`);

  try {
    const customer = await stripe.customers.create({
      email: 'test-3pay@fastgradacademy.com',
      test_clock: clock.id,
    });
    console.log(`Customer: ${customer.id}`);

    const product = await stripe.products.create({ name: 'FGA 3-Pay Plan (test)' });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 6900,
      currency: 'usd',
      recurring: { interval: 'month' },
    });
    console.log(`Price: ${price.id} ($69/mo)`);

    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: { token: 'tok_visa' },
    });
    await stripe.paymentMethods.attach(paymentMethod.id, { customer: customer.id });
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: paymentMethod.id },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      collection_method: 'charge_automatically',
      payment_behavior: 'allow_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    const activeSub = await stripe.subscriptions.retrieve(subscription.id);
    console.log(`Subscription: ${activeSub.id} (status: ${activeSub.status})`);

    const schedule = await stripe.subscriptionSchedules.create({
      from_subscription: activeSub.id,
    });
    console.log(`Schedule created: ${schedule.id}`);

    const updated = await stripe.subscriptionSchedules.update(schedule.id, {
      end_behavior: 'cancel',
      proration_behavior: 'none',
      phases: [{
        items: [{ price: price.id, quantity: 1 }],
        start_date: schedule.phases[0].start_date,
        duration: { interval: 'month', interval_count: 3 },
      }],
    });

    const phase = updated.phases[0];
    const check1 = updated.end_behavior === 'cancel'
      && phase.duration?.interval === 'month'
      && phase.duration?.interval_count === 3;
    console.log(`Schedule updated: end_behavior=${updated.end_behavior}, duration=${phase.duration?.interval_count} ${phase.duration?.interval}s`);
    console.log(`\nCHECK 1 - Schedule config correct: ${check1 ? 'PASS' : 'FAIL'}`);

    console.log('\nAdvancing clock +35 days (payment 2)...');
    await stripe.testHelpers.testClocks.advance(clock.id, { frozen_time: addDays(start, 35) });
    await waitForClock(clock.id);

    const inv2 = await stripe.invoices.list({ subscription: activeSub.id, status: 'paid', limit: 20 });
    console.log(`Paid invoices after month 2: ${positivePaidInvoiceCount(inv2.data)}`);

    console.log('Advancing clock +65 days (payment 3)...');
    await stripe.testHelpers.testClocks.advance(clock.id, { frozen_time: addDays(start, 65) });
    await waitForClock(clock.id);

    const inv3 = await stripe.invoices.list({ subscription: activeSub.id, status: 'paid', limit: 20 });
    console.log(`Paid invoices after month 3: ${positivePaidInvoiceCount(inv3.data)}`);

    console.log('Advancing clock +95 days (should NOT bill a 4th)...');
    await stripe.testHelpers.testClocks.advance(clock.id, { frozen_time: addDays(start, 95) });
    await waitForClock(clock.id);

    const inv4 = await stripe.invoices.list({ subscription: activeSub.id, limit: 20 });
    const paidCount = positivePaidInvoiceCount(inv4.data);
    console.log(`Total paid invoices after month 4 window: ${paidCount}`);

    const finalSub = await stripe.subscriptions.retrieve(activeSub.id);
    console.log(`Final subscription status: ${finalSub.status}`);

    const check2 = paidCount === 3;
    const check3 = finalSub.status === 'canceled';
    console.log(`\nCHECK 2 - Exactly 3 paid invoices: ${check2 ? 'PASS' : 'FAIL'} (got ${paidCount})`);
    console.log(`CHECK 3 - Subscription canceled: ${check3 ? 'PASS' : 'FAIL'} (got ${finalSub.status})`);

    const allPass = check1 && check2 && check3;
    console.log(`\n${'='.repeat(50)}`);
    console.log(`VERDICT: ${allPass ? 'ALL PASS - READY FOR LIVE CUTOVER' : 'FAIL - DO NOT ACTIVATE'}`);
    console.log(`${'='.repeat(50)}`);

    await stripe.products.update(product.id, { active: false });
    return allPass;
  } finally {
    await stripe.testHelpers.testClocks.del(clock.id);
    console.log('\nTest artifacts cleaned up.');
  }
}

function positivePaidInvoiceCount(invoices) {
  return invoices.filter((invoice) => invoice.status === 'paid' && invoice.amount_paid > 0).length;
}

verify3PayCap().then((allPass) => {
  process.exit(allPass ? 0 : 1);
}).catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
