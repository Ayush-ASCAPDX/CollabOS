const path = require('path');
const crypto = require('crypto');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cron = require('node-cron');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const WAITLIST_SUMMARY_CRON = process.env.WAITLIST_SUMMARY_CRON || '0 * * * *';

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI. Copy .env.example to .env and set your Mongo connection string.');
  process.exit(1);
}

mongoose.set('strictQuery', true);

const waitlistSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    name: {
      type: String,
      trim: true,
      default: ''
    },
    userType: {
      type: String,
      default: 'Founder'
    },
    interest: {
      type: String,
      default: 'Build startup'
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WaitlistEntry',
      default: null
    },
    referralCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const WaitlistEntry = mongoose.model('WaitlistEntry', waitlistSchema);

const generateReferralCode = () => crypto.randomBytes(4).toString('hex');

const createUniqueReferralCode = async () => {
  let code = generateReferralCode();
  while (await WaitlistEntry.exists({ referralCode: code })) {
    code = generateReferralCode();
  }
  return code;
};

const runWaitlistSummary = async () => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [totalCount, recentSignups] = await Promise.all([
    WaitlistEntry.countDocuments(),
    WaitlistEntry.countDocuments({ createdAt: { $gte: since } })
  ]);

  console.log(
    `[cron] Waitlist summary complete: total=${totalCount}, joined_last_24h=${recentSignups}`
  );
};

const startWaitlistSummaryCron = () => {
  if (!cron.validate(WAITLIST_SUMMARY_CRON)) {
    console.error(`Invalid WAITLIST_SUMMARY_CRON expression: ${WAITLIST_SUMMARY_CRON}`);
    return;
  }

  cron.schedule(WAITLIST_SUMMARY_CRON, async () => {
    try {
      console.log('[cron] Waitlist summary started');
      await runWaitlistSummary();
    } catch (error) {
      console.error('[cron] Waitlist summary failed:', error.message);
    }
  });

  console.log(`Waitlist summary cron active: ${WAITLIST_SUMMARY_CRON}`);
};

app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get(['/cron-task', '/cron-task/'], async (_req, res) => {
  try {
    console.log('[cron] HTTP cron started');
    await runWaitlistSummary();
    console.log('[cron] HTTP cron finished');
    res.type('text/plain').send('OK');
  } catch (error) {
    console.error('[cron] HTTP cron failed:', error.message);
    res.type('text/plain').send('Error');
  }
});

app.get('/api/waitlist/stats', async (_req, res) => {
  try {
    const totalCount = await WaitlistEntry.countDocuments();
    res.json({
      totalCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load waitlist stats.' });
  }
});

app.get('/api/waitlist/leaderboard', async (_req, res) => {
  try {
    const leaders = await WaitlistEntry.find(
      { referralCount: { $gt: 0 } },
      {
        name: 1,
        email: 1,
        userType: 1,
        referralCount: 1
      }
    )
      .sort({ referralCount: -1, createdAt: 1 })
      .limit(5)
      .lean();

    res.json({
      leaders: leaders.map((entry) => ({
        id: String(entry._id),
        name: entry.name || entry.email.split('@')[0],
        userType: entry.userType,
        referralCount: entry.referralCount
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load leaderboard.' });
  }
});

app.get('/api/waitlist/entries', async (_req, res) => {
  try {
    const entries = await WaitlistEntry.find(
      {},
      {
        email: 1,
        name: 1,
        userType: 1,
        interest: 1,
        referralCode: 1,
        referralCount: 1,
        createdAt: 1
      }
    )
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      entries: entries.map((entry, index) => ({
        id: String(entry._id),
        position: entries.length - index,
        email: entry.email,
        name: entry.name,
        userType: entry.userType,
        interest: entry.interest,
        referralCode: entry.referralCode,
        referralCount: entry.referralCount,
        createdAt: entry.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load waitlist entries.' });
  }
});

app.get('/api/waitlist/export.csv', async (_req, res) => {
  try {
    const entries = await WaitlistEntry.find(
      {},
      {
        email: 1,
        name: 1,
        userType: 1,
        interest: 1,
        referralCode: 1,
        referralCount: 1,
        createdAt: 1
      }
    )
      .sort({ createdAt: -1 })
      .lean();

    const rows = [
      ['email', 'name', 'userType', 'interest', 'referralCode', 'referralCount', 'createdAt'],
      ...entries.map((entry) => [
        entry.email,
        entry.name || '',
        entry.userType,
        entry.interest,
        entry.referralCode,
        String(entry.referralCount || 0),
        entry.createdAt instanceof Date ? entry.createdAt.toISOString() : entry.createdAt
      ])
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=\"waitlist-export.csv\"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export waitlist entries.' });
  }
});

app.post('/api/waitlist', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const name = String(req.body.name || '').trim();
    const userType = String(req.body.userType || 'Founder').trim();
    const interest = String(req.body.interest || 'Build startup').trim();
    const referralCodeInput = String(req.body.referralCode || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const existingEntry = await WaitlistEntry.findOne({ email }).lean();
    if (existingEntry) {
      return res.status(409).json({ error: 'This email has already joined the waitlist.' });
    }

    let referrer = null;
    if (referralCodeInput) {
      referrer = await WaitlistEntry.findOne({ referralCode: referralCodeInput });
    }

    const referralCode = await createUniqueReferralCode();

    const entry = await WaitlistEntry.create({
      email,
      name,
      userType,
      interest,
      referralCode,
      referredBy: referrer ? referrer._id : null
    });

    if (referrer) {
      await WaitlistEntry.updateOne(
        { _id: referrer._id },
        { $inc: { referralCount: 1 } }
      );
    }

    const totalCount = await WaitlistEntry.countDocuments();
    const referralLink = `${req.protocol}://${req.get('host')}/waitlist.html?ref=${entry.referralCode}`;

    res.status(201).json({
      message: 'You are on the waitlist.',
      position: totalCount,
      totalCount,
      referralCode: entry.referralCode,
      referralLink,
      referredBy: referrer ? referrer.referralCode : null,
      entry: {
        email: entry.email,
        name: entry.name,
        userType: entry.userType,
        interest: entry.interest,
        timestamp: entry.createdAt
      }
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ error: 'This email has already joined the waitlist.' });
    }
    res.status(500).json({ error: 'Unable to join the waitlist right now.' });
  }
});
// Redirect unknown GET /api/* requests to the waitlist page.
app.get('/api/*', (_req, res) => {
  res.redirect('/waitlist.html');
});


app.get('*', (req, res) => {
  const requestedPath = path.join(__dirname, req.path);
  if (path.extname(requestedPath)) {
    return res.status(404).send('Not found');
  }

  const fallbackFile = req.path === '/' ? 'index.html' : `${req.path.replace(/^\/+/, '')}`;
  const resolvedFile = path.join(__dirname, fallbackFile);
  res.sendFile(resolvedFile, (error) => {
    if (error) {
      res.status(404).sendFile(path.join(__dirname, 'index.html'));
    }
  });
});

const start = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    startWaitlistSummaryCron();
    app.listen(PORT, () => {
      console.log(`CollabOS server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

start();
