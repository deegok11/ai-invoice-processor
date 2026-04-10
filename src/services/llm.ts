import { GoogleGenAI } from '@google/genai';
import * as pdfjsLib from 'pdfjs-dist';
import type { InvoiceData } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;

const EXTRACTION_PROMPT = `You are an invoice data extraction assistant. Analyze the provided invoice document and extract the following structured data in JSON format:

{
  "vendorName": "string - the vendor/supplier name",
  "invoiceNo": "string - the invoice number",
  "date": "string - the invoice date in YYYY-MM-DD format",
  "lineItems": [
    {
      "description": "string - item description",
      "quantity": number,
      "unitPrice": number,
      "amount": number
    }
  ],
  "tax": number - total tax amount,
  "total": number - total invoice amount
}

Rules:
- Return ONLY valid JSON, no markdown or explanation
- All monetary values should be numbers without currency symbols
- If a field is not found, use empty string for strings and 0 for numbers
- For line items, extract all visible items
- Parse Indian number formats (e.g., 1,00,000 = 100000)`;

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function renderPDFToImages(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const images: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const scale = 2;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    const dataUrl = canvas.toDataURL('image/png');
    images.push(dataUrl.split(',')[1]);
  }

  return images;
}

export async function extractInvoiceData(
  file: File,
  apiKey: string,
  provider: 'openai' | 'gemini'
): Promise<InvoiceData> {
  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';

  if (!isImage && !isPDF) {
    throw new Error('Unsupported file type. Please upload a PDF or image file.');
  }

  if (provider === 'openai') {
    return extractWithOpenAI(file, apiKey, isPDF);
  } else {
    return extractWithGemini(file, apiKey, isPDF);
  }
}

async function extractWithOpenAI(
  file: File,
  apiKey: string,
  isPDF: boolean
): Promise<InvoiceData> {
  const imageEntries: Array<{ base64: string; mimeType: string }> = [];

  if (isPDF) {
    const pages = await renderPDFToImages(file);
    for (const page of pages) {
      imageEntries.push({ base64: page, mimeType: 'image/png' });
    }
  } else {
    const base64 = await fileToBase64(file);
    imageEntries.push({ base64, mimeType: file.type });
  }

  const content: Array<Record<string, unknown>> = [
    { type: 'text', text: EXTRACTION_PROMPT },
    ...imageEntries.map((img) => ({
      type: 'image_url',
      image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
    })),
  ];

  const messages = [{ role: 'user', content }];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      max_tokens: 2000,
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API request failed');
  }

  const data = await response.json();
  const responseContent = data.choices?.[0]?.message?.content;

  if (!responseContent) {
    throw new Error(
      'OpenAI returned an empty response. The model may not have been able to read the image. ' +
      (data.choices?.[0]?.message?.refusal || '')
    );
  }

  return parseExtractedJSON(responseContent);
}

async function extractWithGemini(
  file: File,
  apiKey: string,
  isPDF: boolean
): Promise<InvoiceData> {
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-3-flash-preview';

  const imageParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];

  if (isPDF) {
    const pages = await renderPDFToImages(file);
    for (const page of pages) {
      imageParts.push({ inlineData: { mimeType: 'image/png', data: page } });
    }
  } else {
    const base64 = await fileToBase64(file);
    imageParts.push({ inlineData: { mimeType: file.type, data: base64 } });
  }

  const result = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: EXTRACTION_PROMPT },
          ...imageParts,
        ],
      },
    ],
    config: { temperature: 0 },
  });

  const content = result.text;
  if (!content) throw new Error('Gemini returned an empty response');

  return parseExtractedJSON(content);
}

function parseExtractedJSON(content: string): InvoiceData {
  // Strip markdown code fences if present
  const cleaned = content
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  if (!cleaned) {
    throw new Error('LLM returned empty content — the image may be unreadable or not an invoice');
  }

  try {
    const parsed = JSON.parse(cleaned);

    const result: InvoiceData = {
      vendorName: String(parsed.vendorName || ''),
      invoiceNo: String(parsed.invoiceNo || ''),
      date: String(parsed.date || ''),
      lineItems: Array.isArray(parsed.lineItems)
        ? parsed.lineItems.map((item: Record<string, unknown>) => ({
            description: String(item.description || ''),
            quantity: Number(item.quantity) || 0,
            unitPrice: Number(item.unitPrice) || 0,
            amount: Number(item.amount) || 0,
          }))
        : [],
      tax: Number(parsed.tax) || 0,
      total: Number(parsed.total) || 0,
    };

    // Guard against LLM returning valid JSON but with no useful data
    if (!result.vendorName && !result.invoiceNo && result.total === 0 && result.lineItems.length === 0) {
      throw new Error(
        'LLM could not extract invoice data from this image. Please ensure the image is clear and contains invoice information.'
      );
    }

    return result;
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error('Failed to parse LLM response as valid invoice data');
    }
    throw err;
  }
}
