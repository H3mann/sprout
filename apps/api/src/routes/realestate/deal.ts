import { Router } from 'express';
import { realmSupabase } from '../../supabase';
import { getCensusData } from '../../services/census';
import { analyzeDeal } from '../../services/dealCalculator';

const router = Router();

router.post('/analyze', async (req, res) => {
  const {
    property_address, purchase_price, down_payment_pct, interest_rate,
    loan_term_years, expected_monthly_rent, monthly_expenses,
    property_taxes_annual, insurance_annual, hoa_monthly, vacancy_rate_pct,
  } = req.body;

  if (!property_address || !purchase_price) {
    return res.status(400).json({ error: 'Property address and purchase price are required' });
  }

  try {
    const metrics = analyzeDeal({
      purchasePrice: purchase_price,
      downPaymentPct: down_payment_pct || 20,
      interestRate: interest_rate || 7.0,
      loanTermYears: loan_term_years || 30,
      expectedMonthlyRent: expected_monthly_rent || 0,
      monthlyExpenses: monthly_expenses || 0,
      propertyTaxesAnnual: property_taxes_annual || 0,
      insuranceAnnual: insurance_annual || 0,
      hoaMonthly: hoa_monthly || 0,
      vacancyRatePct: vacancy_rate_pct || 5,
    });

    let aiSummary = '';
    if (process.env.PERPLEXITY_API_KEY) {
      try {
        const perplexityRes = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [
              {
                role: 'system',
                content: 'You are a real estate investment analyst. Provide brief, data-driven investment analysis.',
              },
              {
                role: 'user',
                content: `Analyze this investment property: ${property_address}. Purchase price: $${purchase_price}. Expected monthly rent: $${expected_monthly_rent}. Key metrics: Cap rate ${metrics.capRate}%, Cash-on-cash ${metrics.cashOnCashReturn}%, Monthly cash flow $${metrics.monthlyCashFlow}, Investment score ${metrics.investmentScore}/100. Provide a brief 2-3 paragraph analysis of this deal including any relevant market context for the area.`,
              },
            ],
          }),
        });

        if (perplexityRes.ok) {
          const data = await perplexityRes.json();
          aiSummary = data.choices?.[0]?.message?.content || '';
        }
      } catch (err) {
        console.error('[deal:perplexity]', err);
      }
    }

    res.json({ metrics, aiSummary, propertyData: {} });
  } catch (err) {
    console.error('[deal:analyze]', err);
    res.status(500).json({ error: 'Failed to analyze deal' });
  }
});

router.get('/', async (req, res) => {
  if (!req.userId) {
    return res.json([]);
  }

  try {
    const { data, error } = await realmSupabase
      .from('deal_analyses')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[deal:list]', error.message);
      return res.status(500).json({ error: 'Failed to fetch deals' });
    }

    res.json(data);
  } catch (err) {
    console.error('[deal:list]', err);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

router.get('/:id', async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Sign in to view saved analyses' });
  }

  try {
    const { data, error } = await realmSupabase
      .from('deal_analyses')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (error) {
      console.error('[deal:get]', error.message);
      return res.status(404).json({ error: 'Deal not found' });
    }

    res.json(data);
  } catch (err) {
    console.error('[deal:get]', err);
    res.status(500).json({ error: 'Failed to fetch deal' });
  }
});

router.post('/save', async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Sign in to save analyses' });
  }

  try {
    const { data, error } = await realmSupabase
      .from('deal_analyses')
      .insert({ ...req.body, user_id: req.userId })
      .select()
      .single();

    if (error) {
      console.error('[deal:save]', error.message);
      return res.status(400).json({ error: 'Failed to save deal' });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('[deal:save]', err);
    res.status(500).json({ error: 'Failed to save deal' });
  }
});

router.delete('/:id', async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Sign in to delete analyses' });
  }

  try {
    const { error } = await realmSupabase
      .from('deal_analyses')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId);

    if (error) {
      console.error('[deal:delete]', error.message);
      return res.status(400).json({ error: 'Failed to delete deal' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('[deal:delete]', err);
    res.status(500).json({ error: 'Failed to delete deal' });
  }
});

export default router;
