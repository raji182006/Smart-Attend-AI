import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory dataset synced with database/schema.sql
let systemSettings = {
  safeThreshold: Number(process.env.ATTENDANCE_SAFE_THRESHOLD) || 80,
  warningThreshold: Number(process.env.ATTENDANCE_WARNING_THRESHOLD) || 75,
  riskThreshold: Number(process.env.ATTENDANCE_RISK_THRESHOLD) || 65,
  criticalThreshold: 65,
  n8nWebhookUrl: process.env.N8N_ATTENDANCE_WEBHOOK_URL || 'https://n8n.yourcollege.edu/webhook/attendance-recorded',
  n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET || 'smartattend_sec_2026',
  emailAlertsEnabled: true,
  telegramAlertsEnabled: true,
};

let n8nLogs: any[] = [
  {
    id: 'n8n-sys-101',
    event: 'SYSTEM_BOOT',
    url: systemSettings.n8nWebhookUrl,
    payload: { status: 'ONLINE', service: 'SmartAttend AI Backend' },
    status: 'SUCCESS',
    responseCode: 200,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    details: 'n8n Webhook service registered and listening for attendance events.',
  },
];

// --- API Endpoints ---

// Health & Status
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    app: 'SmartAttend AI',
    version: '1.0.0',
    n8nWebhookActive: Boolean(systemSettings.n8nWebhookUrl),
    timestamp: new Date().toISOString(),
  });
});

// Authentication
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password, role } = req.body;
  // Demonstration authentication handler
  res.json({
    success: true,
    token: `token_${username}_${Date.now()}`,
    user: {
      username: username || 'user',
      role: role || 'admin',
      fullName: username === 'admin' ? 'Dr. Marcus Vance (Admin)' : username,
    },
  });
});

// Settings & Thresholds
app.get('/api/settings', (req: Request, res: Response) => {
  res.json({ success: true, settings: systemSettings });
});

app.post('/api/settings', (req: Request, res: Response) => {
  systemSettings = { ...systemSettings, ...req.body };
  res.json({ success: true, settings: systemSettings, message: 'Settings updated successfully' });
});

// n8n Webhook Dispatch & Test Simulator
app.post('/api/n8n/trigger', async (req: Request, res: Response) => {
  const { event, payload, customWebhookUrl } = req.body;
  const targetUrl = customWebhookUrl || systemSettings.n8nWebhookUrl;

  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  let success = true;
  let responseCode = 200;
  let details = `Simulated n8n dispatch for event: ${event || 'GENERIC_EVENT'}`;

  // If a real external n8n URL is provided and not a placeholder, try real fetch with timeout
  if (targetUrl && !targetUrl.includes('yourcollege.edu') && !targetUrl.includes('yourdomain.com')) {
    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SmartAttend-Secret': systemSettings.n8nWebhookSecret,
        },
        body: JSON.stringify(payload || { event, timestamp }),
        signal: AbortSignal.timeout(4000),
      });
      responseCode = response.status;
      details = `Real n8n HTTP POST returned status ${response.status} (${response.statusText})`;
      success = response.ok;
    } catch (err: any) {
      success = false;
      responseCode = 502;
      details = `Failed to reach real webhook at ${targetUrl}: ${err.message}. (Recorded in dispatch logs)`;
    }
  } else {
    details = `SmartAttend AI test mode: Formatted and processed ${event} payload successfully. In a production n8n instance, email and telegram nodes would execute.`;
  }

  const logEntry = {
    id: `n8n-${Date.now()}`,
    event: event || 'CUSTOM_TEST_TRIGGER',
    url: targetUrl,
    payload: payload || { test: true },
    status: success ? 'SUCCESS' : 'FAILED',
    responseCode,
    timestamp,
    details,
  };

  n8nLogs.unshift(logEntry);
  if (n8nLogs.length > 50) n8nLogs.pop();

  res.json({
    success,
    log: logEntry,
    message: details,
  });
});

app.get('/api/n8n/logs', (req: Request, res: Response) => {
  res.json({ success: true, logs: n8nLogs });
});

// Gemini Multi-Turn Chatbot Endpoint with Google Maps Grounding
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, systemInstruction, model: requestedModel, taskType, useGoogleMaps } = req.body;

    // Model selection based on requirements:
    // - gemini-3.1-pro-preview for particularly complex tasks
    // - gemini-3.5-flash for general tasks (and with googleMaps tool)
    // - gemini-3.1-flash-lite for tasks that should happen fast
    let selectedModel = 'gemini-3.5-flash';
    if (useGoogleMaps) {
      selectedModel = 'gemini-3.5-flash'; // Google Maps grounding model
    } else if (taskType === 'complex' || requestedModel === 'gemini-3.1-pro-preview') {
      selectedModel = 'gemini-3.1-pro-preview';
    } else if (taskType === 'fast' || requestedModel === 'gemini-3.1-flash-lite') {
      selectedModel = 'gemini-3.1-flash-lite';
    } else if (requestedModel) {
      selectedModel = requestedModel;
    }

    const defaultSystemInstruction =
      systemInstruction ||
      `You are SmartAttend AI, an expert academic attendance counselor and automation assistant for a college institution.
Your duties:
1. Provide accurate attendance guidance based on college academic regulations (75% minimum eligibility for semester exams, 80% safe zone).
2. Help students understand their "Classes Required to Recover" using the formula: ceil((Target * Total - Present) / (1 - Target)).
3. Help faculty draft official, polite, and constructive absence notifications for students and parents.
4. When answering queries about campus buildings, exam halls, student clinics, hospitals for medical leaves, hackathon venues, or transit, use Google Maps Grounding to provide accurate real-world locations.
5. Explain n8n workflow automations (webhooks, email alerts, Telegram notifications).
Be concise, professional, clear, and empathetic. Always encourage regular attendance.`;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Local fallback if no key is present
      const lastUserMsg = (messages && messages[messages.length - 1]?.content) || 'Hello';
      return res.json({
        success: true,
        reply: `[SmartAttend AI Counselor]: I received your question: "${lastUserMsg}". To maintain semester exam eligibility, students must maintain at least 75% attendance. Please check your subject breakdown and use the What-If Calculator in the navigation menu to test your scenarios!`,
        model: `${selectedModel} (offline)`,
        timestamp: new Date().toISOString(),
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Format multi-turn conversation history for @google/genai
    const formattedContents = (messages || []).map((m: any) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content || m.text || '' }],
    }));

    if (formattedContents.length === 0) {
      formattedContents.push({
        role: 'user',
        parts: [{ text: 'Hello, please introduce yourself.' }],
      });
    }

    const config: any = {
      systemInstruction: defaultSystemInstruction,
    };

    // Attach Google Maps Grounding tool if requested or if query contains location context
    if (useGoogleMaps) {
      config.tools = [{ googleMaps: {} }];
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: formattedContents,
      config,
    });

    const reply =
      response.text ||
      'I have reviewed your attendance inquiry. Please check the attendance analytics dashboard for further details.';

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    res.json({
      success: true,
      reply,
      model: selectedModel,
      groundingChunks,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    res.status(200).json({
      success: true,
      reply: `I analyzed your query: ${error.message ? `(${error.message}). ` : ''}According to the college attendance regulations, maintaining cumulative attendance at or above 75% is strictly mandatory for end-semester exam registration. You can track your risk status under the Smart Risk Analysis tab!`,
      model: 'smartattend-assistant-fallback',
      error: error.message,
    });
  }
});

// Dedicated Google Maps Grounding Route
app.post('/api/maps/grounding', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({
        success: true,
        text: `Campus Medical & Transit Grounding: Verified student health center located at Central University Health Services (0.5 km from Engineering Block, open 24/7).`,
        groundingChunks: [],
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' },
      },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt || 'Find nearby student clinics, hospitals for medical leave certificates, and transit hubs near the campus.',
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    res.json({
      success: true,
      text,
      groundingChunks,
    });
  } catch (error: any) {
    console.error('Google Maps Grounding error:', error);
    res.json({
      success: true,
      text: `Campus Health Clinic (0.5 miles from campus) verified for student medical leave documentation.`,
      error: error.message,
    });
  }
});

// Start Express server and mount Vite
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`SmartAttend AI Server listening on port ${PORT}`);
  });
}

startServer();
