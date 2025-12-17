import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * n8n Webhook Endpoint
 * Bu endpoint n8n otomasyonlarından gelen istekleri handle eder
 * 
 * n8n'de kullanım:
 * 1. Webhook node'u ekle
 * 2. Method: POST
 * 3. URL: http://your-domain.com/api/n8n/webhook
 * 4. Body: { "userMessage": "BTC ne olur?" }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // CORS headers - n8n'den gelen istekler için
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userMessage, marketContext } = req.body;

    if (!userMessage || typeof userMessage !== 'string') {
      return res.status(400).json({ 
        error: 'userMessage is required and must be a string' 
      });
    }

    // Mevcut chat API'yi kullan (marketContext opsiyonel - backend otomatik çeker)
    const chatResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userMessage: userMessage,
        marketContext: marketContext // n8n'den market context gönderilebilir
      }),
    });

    if (!chatResponse.ok) {
      const errorData = await chatResponse.json().catch(() => ({}));
      return res.status(chatResponse.status).json({
        error: errorData.error || 'AI yanıtı alınamadı',
        details: errorData.details
      });
    }

    const data = await chatResponse.json();

    // n8n uyumlu format
    return res.status(200).json({
      message: data.message,
      usage: data.usage,
      success: true
    });

  } catch (error) {
    console.error('n8n webhook error:', error);
    return res.status(500).json({ 
      error: 'Webhook işlenirken hata oluştu',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
