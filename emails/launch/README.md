# Founding-Member Launch Email Sequence

This folder contains the 5-email founding-member launch sequence for Fast Grad Academy.

These are warm-list emails from **John Zheng** to people who know John or previously engaged with Fast Grad Academy. They are not a cold drip sequence.

## Send Schedule

| Email | File | Timing | Goal |
| --- | --- | --- | --- |
| 1 | `01-rebuilt.html` | Monday / Day 1 | Announce the rebuilt academy and founding-member offer |
| 2 | `02-math.html` | Day 3 | Explain the $39,633 savings logic |
| 3 | `03-whats-inside.html` | Day 5 | Show what is inside the 12-chapter system |
| 4 | `04-price-ending.html` | Day 6 | Remind that founding price ends Friday |
| 5 | `05-final-call.html` | Day 7 | Final short close before midnight |

## Subject Line Options

### Email 1: I rebuilt the academy

- I rebuilt Fast Grad Academy from scratch
- The college shortcut nobody told me about
- How I graduated in 1 year (and you can too)

### Email 2: The math nobody does

- The $39,633 question
- What 4 years of college actually costs
- This one decision saves more than your first salary

### Email 3: What's inside

- 12 chapters. One year. Here's what's inside.
- The exact playbook (chapter by chapter)
- Everything I wish someone told me freshman year

### Email 4: Founding price ends Friday

- Price goes up Friday
- 4 spots left at $197
- Last chance at the founding price

### Email 5: Final call

- Closing tonight
- Last email about this
- Your call

## Resend Setup

1. Create or select the launch audience in Resend.
2. Suggested audience tag: `fga-founding-launch`.
3. Upload or paste each HTML file as an email template.
4. Set sender name to `John Zheng`.
5. Send each email according to the schedule above.
6. Use one CTA per email: `https://fastgradacademy.com`.
7. Confirm the unsubscribe placeholder resolves before sending.

## Merge Tags Used

- `{{first_name}}`
- `{{unsubscribe_url}}`

The templates use a greeting pattern:

```handlebars
{{#if first_name}}Hey {{first_name}},{{else}}Hey,{{/if}}
```

If Resend is sending without conditional merge support in the chosen workflow, precompute a `greeting` field or replace the opening line with `Hey,` before sending.

## Metrics

Expected minimum benchmarks:

- Open rate: >25%
- Click rate: >5%

John's newsletter has previously benchmarked much higher:

- 66.4% open rate
- 17.7% click-through rate

## QA Checklist

- All links point to `https://fastgradacademy.com`.
- Every email uses the sign-off `To your freedom, John`.
- No images or external fonts are included.
- CSS is inline only.
- Each email includes `{{unsubscribe_url}}`.
- Sender should be `John Zheng`.
