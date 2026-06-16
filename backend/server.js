const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

const plaidConfig = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(plaidConfig);

app.post('/api/create_link_token', async (req, res) => {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: 'user-id-123' },
      client_name: 'Subscription Tracker',
      products: ['transactions'],
      country_codes: ['FR', 'BE', 'GB'],
      language: 'fr',
    });
    res.json(response.data);
  } catch (err) {
    console.error('Erreur create_link_token:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/exchange_token', async (req, res) => {
  try {
    const { public_token } = req.body;
    const response = await plaidClient.itemPublicTokenExchange({ public_token });
    res.json({ access_token: response.data.access_token });
  } catch (err) {
    console.error('Erreur exchange_token:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/subscriptions', async (req, res) => {
  console.log('Requete subscriptions recue !');
  const mockSubscriptions = [
    { name: 'Netflix', amount: 17.99, date: '2026-06-01' },
    { name: 'Spotify', amount: 10.99, date: '2026-06-03' },
    { name: 'Amazon Prime', amount: 6.99, date: '2026-06-05' },
    { name: 'Disney+', amount: 8.99, date: '2026-06-07' },
    { name: 'iCloud', amount: 2.99, date: '2026-06-10' },
  ];
  res.json({ subscriptions: mockSubscriptions });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('Serveur lance sur http://localhost:' + PORT);
  console.log('En attente de requetes...');
});
