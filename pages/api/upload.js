import multer from "multer";
import pdfParse from "pdf-parse";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });
export const config = { api: { bodyParser: false } };

//  Function to generate 768-dimensional embeddings
async function generateEmbeddings(text) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" }); // 🔹 FIXED MODEL NAME

  try {
    console.log("🔹 Generating embeddings...");
    const embeddingResponse = await model.embedContent({
      model: "text-embedding-004", //  Explicitly specify model
      content: { parts: [{ text }] }, //  Fix API format
    });

    if (!embeddingResponse?.embedding?.values) {
      throw new Error("Embedding response missing values.");
    }

    console.log(" Embeddings generated successfully!");
    return embeddingResponse.embedding.values; // Returns 768-dimension array
  } catch (error) {
    console.error("Embedding Error:", error);
    throw new Error("Embedding generation failed.");
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    //  Handle file upload
    const fileBuffer = await new Promise((resolve, reject) => {
      upload.single("resume")(req, res, (err) => {
        if (err) return reject(new Error("File upload error"));
        if (!req.file) return reject(new Error("No file uploaded"));
        resolve(req.file.buffer);
      });
    });

    //  Parse PDF text
    const text = await pdfParse(fileBuffer).then((data) => data.text);
    if (!text) throw new Error("Failed to extract text from PDF.");
    
    const candidateProfile = { text, ...req.body };

    //  Generate 768-dimensional vector embeddings
    const vectorEmbeddings = await generateEmbeddings(text);
    if (vectorEmbeddings.length !== 768) {
      throw new Error("Generated embeddings do not match Pinecone index dimension.");
    }

    //  Initialize Pinecone Client
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

    //  Upsert Candidate Data in Pinecone
    await index.upsert([
      {
        id: req.body.email,
        values: vectorEmbeddings,
      },
    ]);

    //  AI-powered Evaluation (Google Gemini API)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const aiResponse = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `Evaluate this candidate:\n${text}` }] }],
    });

    //  Extract AI response safely
    const evaluation = aiResponse?.response?.candidates?.[0]?.content?.parts?.[0]?.text || "No evaluation received.";

    res.status(200).json({ success: true, profile: candidateProfile, evaluation });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
