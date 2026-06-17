const express = require('express');
const cors = require('cors');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

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

// Token qui fonctionne deja
let cachedToken = 'access-sandbox-3762669d-372d-4894-9273-197d9a6f89c7';

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
    const access_token = response.data.access_token;
    console.log('Nouveau token recu:', access_token);
    res.json({ access_token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/subscriptions', async (req, res) => {
  console.log('Requete subscriptions recue!');
  try {
    // Utilise le token qui marche
    const access_token = cachedToken;
    console.log('Utilisation du token:', access_token);

    const now = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 3);

    const response = await plaidClient.transactionsGet({
      access_token,
      start_date: start.toISOString().split('T')[0],
      end_date: now.toISOString().split('T')[0],
    });

    const transactions = response.data.transactions;
    console.log('Total transactions:', transactions.length);

    const nameCount = {};
    transactions.forEach(t => {
      const name = t.merchant_name || t.name;
      if (!nameCount[name]) nameCount[name] = [];
      nameCount[name].push(t);
    });

    const subscriptions = Object.values(nameCount)
      .filter(group => group.length >= 2)
      .map(group => ({
        name: group[0].merchant_name || group[0].name,
        amount: Math.abs(group[0].amount),
        date: group[0].date,
        occurrences: group.length,
        logo_url: group[0].logo_url,
      }));

    console.log('Abonnements detectes:', subscriptions.length);
    res.json({ subscriptions });
  } catch (err) {
    console.error('Erreur:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('Serveur lance sur http://localhost:' + PORT);
  console.log('En attente de requetes...');
});
