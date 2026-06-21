import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini API client
let aiInstance: GoogleGenAI | null = null;
function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

// API endpoint to check system status
app.get("/api/health", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
  res.json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    hasGeminiKey: hasKey
  });
});

// AI Endpoint: Generate product descriptions and tags
app.post("/api/ai/describe", async (req, res) => {
  const { name, category, crudeNotes, targetPrice } = req.body;
  const ai = getAI();

  const mockGenerated = `This outstanding product in our "${category || 'General'}" category is designed to meet high professional standards. Engineered for durability and premium ergonomics, it elevates your everyday business workspace workflow. Highly recommended for cost-conscious, efficiency-driven enterprises.`;
  const mockTags = [category || 'Workspace', 'SaaSPremium', 'Organizer', 'TopQuality'];

  if (!ai) {
    // Return placeholder response with a status warning
    return res.json({
      success: true,
      simulated: true,
      description: `[AI SIMULATED] "${name}" is designed as a standout selection in ${category}. ${mockGenerated} Note: Add your GEMINI_API_KEY in the secrets menu to activate real-time Gemini output!`,
      tags: mockTags,
      suggestedPrice: targetPrice ? Number(targetPrice) : 49.99
    });
  }

  try {
    const prompt = `You are an expert sales copywriter for a premium small-business inventory system.
    Generate a highly converting standard product description (1-3 lines) and physical product tags (as a JSON list) for:
    Product Name: "${name}"
    Category: "${category}"
    Crude Notes: "${crudeNotes || 'No notes provided'}"
    Target Price: $${targetPrice || 'Not specified'}

    Respond with JSON containing ONLY these keys:
    {
      "description": "Product copy here in clear human voice.",
      "tags": ["tag1", "tag2", "tag3"],
      "suggestedPrice": number
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({
      success: true,
      simulated: false,
      description: parsed.description || mockGenerated,
      tags: parsed.tags || mockTags,
      suggestedPrice: parsed.suggestedPrice || (targetPrice ? Number(targetPrice) : 49.99)
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate AI product details"
    });
  }
});

// AI Endpoint: Restock Advisor & Email Builder
app.post("/api/ai/advise", async (req, res) => {
  const { lowStockProducts, supplier } = req.body;
  const ai = getAI();

  if (!ai) {
    return res.json({
      success: true,
      simulated: true,
      guidance: `**Restock Strategy Recommendation (Simulated):**\n\nBased on your low stock levels for supplier **${supplier?.name || "Global Dist."}**, we recommend a restock purchase order targeting item safety buffer ratios. \n\n*Suggested Action plan:*\n` +
        (lowStockProducts || []).map((p: any) => `- **${p.name}** (SKU: \`${p.sku}\`): Current stock is **${p.quantity}** (Safety stock: **${p.safetyStock}**). We recommend ordering **${p.safetyStock * 2 - p.quantity}** units to satisfy standard quarterly sales run-rates.`).join('\n') +
        `\n\n---\n*Configure a live Gemini API key in AI Studio to get customized strategic reorder emails and demand forecast models automatically generated!*`
    });
  }

  try {
    const prdcts = JSON.stringify(lowStockProducts);
    const prompt = `You are a legendary SaaS Inventory Analyst. Write a detailed restock guidance summary and draft a professional purchase order email that the owner can copy-paste and send to their supplier "${supplier?.name || 'the supplier'}".
    Low Stock Products Data: ${prdcts}
    Supplier Contact: ${supplier?.contactName || 'Agent'} (${supplier?.email || 'sales@supplier.com'})

    Format your output cleanly using markdown. Start with a section "### 📊 Strategic Stock Safety Assessment" followed by "### ✉️ Drafted Supplier Purchase Order Email".`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({
      success: true,
      simulated: false,
      guidance: response.text
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Advisor error"
    });
  }
});

// AI Endpoint: Anomaly Detection / Space Optimizer
app.post("/api/ai/optimize", async (req, res) => {
  const { allProducts } = req.body;
  const ai = getAI();

  if (!ai) {
    return res.json({
      success: true,
      simulated: true,
      recommendation: `### 📦 Storage & Capital Optimization Advice (Simulated)\n\nReviewing your product data sheets, we have spotted optimization windows:\n1. **Dead Stock Warning**: Some storage sectors contain slow-moving stock matching low sale velocity.\n2. **Capital Lockup**: High-carrying items contribute to passive expenses. Consider bundle offers on luxury inventory.\n\n*Add a genuine GEMINI_API_KEY in the secrets UI for comprehensive custom data auditing!*`
    });
  }

  try {
    const prompt = `You are an expert warehouse supply-chain consultant. Analyze this small business's real inventory database:
    ${JSON.stringify(allProducts)}

    Identify:
    - Potential "Dead stock" (over-stocked items, far above safety margins, low sales value)
    - Storage cost bottlenecks (bulky items with low price-to-size balance if visible, or categories with excessive items)
    - Actionable recommendations (e.g., specific bundles or promotions to liquidate cold stock and restock high-performing margins)

    Render your advice in deep detail using clean business formatting. Make it friendly, pragmatic, and highly readable.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({
      success: true,
      simulated: false,
      recommendation: response.text
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Optimization error"
    });
  }
});

// Serve web build files & setup dev middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    // Handle SPA fallbacks
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Inventory SaaS Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
