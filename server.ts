import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up JSON body parser with limit for base64 file payloads
app.use(express.json({ limit: "50mb" }));

// Initialize Gemini Client server-side
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not defined. AI syllabus generation will use mock responses.");
}

// REST API endpoint for health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", aiEnabled: !!ai });
});

// JSON schema definition for the AI structured syllabus output
const syllabusSchema = {
  type: Type.OBJECT,
  properties: {
    subjects: {
      type: Type.ARRAY,
      description: "List of subjects extracted from the syllabus description or files.",
      items: {
        type: Type.OBJECT,
        properties: {
          subjectName: {
            type: Type.STRING,
            description: "Name of the subject, e.g. Bangla 1st, Bangla 2nd, English 1st, Physics."
          },
          sections: {
            type: Type.ARRAY,
            description: "The distinct sections under the subject, such as Prose, Poem, Grammar, Supplementary.",
            items: {
              type: Type.OBJECT,
              properties: {
                sectionName: {
                  type: Type.STRING,
                  description: "Name of the section."
                },
                chapters: {
                  type: Type.ARRAY,
                  description: "List of chapters or topics belonging to this section.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      chapterName: {
                        type: Type.STRING,
                        description: "Name of the chapter/unit."
                      },
                      estimatedHours: {
                        type: Type.NUMBER,
                        description: "Recommended estimated reading/study time in hours (decimals like 1.5 allowed)."
                      },
                      difficulty: {
                        type: Type.STRING,
                        enum: ["easy", "medium", "hard"],
                        description: "Difficulty assessment of this unit."
                      }
                    },
                    required: ["chapterName", "estimatedHours", "difficulty"]
                  }
                }
              },
              required: ["sectionName", "chapters"]
            }
          }
        },
        required: ["subjectName", "sections"]
      }
    }
  },
  required: ["subjects"]
};

// AI Syllabus Generation Endpoint
app.post("/api/gemini/generate-syllabus", async (req, res) => {
  const { promptText, base64File, mimeType } = req.body;

  if (!promptText && !base64File) {
    return res.status(400).json({ error: "No input description or file provided." });
  }

  // Fallback mock responses if API Key is not set
  if (!ai) {
    console.warn("No Gemini API Client initialized - returning structured dummy syllabus data.");
    return res.json({
      subjects: [
        {
          subjectName: "Bangla 1st",
          sections: [
            {
              sectionName: "Prose",
              chapters: [
                { chapterName: "Shuva", estimatedHours: 1.5, difficulty: "easy" },
                { chapterName: "Momotadi", estimatedHours: 2.0, difficulty: "medium" },
                { chapterName: "Boi Pora", estimatedHours: 1.5, difficulty: "easy" }
              ]
            },
            {
              sectionName: "Poem",
              chapters: [
                { chapterName: "Ranar", estimatedHours: 2.5, difficulty: "hard" },
                { chapterName: "Kopotaksho Nod", estimatedHours: 1.5, difficulty: "medium" }
              ]
            }
          ]
        },
        {
          subjectName: "English 1st",
          sections: [
            {
              sectionName: "Reading Test",
              chapters: [
                { chapterName: "Unit 1: People or Institutions", estimatedHours: 3.0, difficulty: "hard" },
                { chapterName: "Unit 2: Traffic Education", estimatedHours: 2.0, difficulty: "medium" }
              ]
            }
          ]
        }
      ]
    });
  }

  try {
    const contents: any[] = [];

    // If base64 file is attached (PDF or Image, etc.)
    if (base64File && mimeType) {
      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: base64File
        }
      });
    }

    // Standard task instruction and core context instruction
    const textPrompt = `You are an expert Pre-Test Exam planner content extractor.
Your task is to analyze the user syllabus description or attached document/image, extract all subjects, specify the sections (such as 'Prose', 'Poetry', 'Supplementary Reading', 'Grammar', 'Writing', etc.) they belong in, and group the chapters under those sections.

CRITICAL INSTRUCTION FOR SECTIONS:
- You must always assign a proper, specific section to every chapter (such as 'Prose', 'Poetry', 'Supplementary Reading', 'Grammar', 'Writing', 'Drama', or 'Novel').
- Do not group everything under a single generic section like 'Chapters' or 'Syllabus' if you can classify them.
- If the section name is not explicitly mentioned in the user description or file, you MUST infer the correct academic section name based on standard educational curricula.
- For example, in Bangla 1st paper: 'Ranar', 'Kopotaksho Nod', 'Kabar' are poetry/poems ('Poetry'), while 'Shuva', 'Boi Pora', 'Momotadi', 'Chashi' are prose ('Prose'), and 'Bohirpir' or 'Kaktarua' are supplementary reading ('Supplementary Reading').
- For English: group units/chapters into standard sections like 'Reading', 'Writing', 'Grammar', or 'Literature'.
- Ensure every extracted chapter belongs to a meaningful section, and that subjects names are accurate and polished.

The user prompt description is:
"${promptText || "Extract pretest academic syllabus from attached file"}"`;

    contents.push({ text: textPrompt });

    // Requesting structured JSON from Gemini 3.5 Flash
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: syllabusSchema,
        systemInstruction: "You are a professional educational planner. Parse and structure all subjects, academic sections, and chapters from transcripts, text, and files. You MUST group chapters into their correct sections (e.g., Prose, Poetry, Supplementary Reading, Grammar, etc.). If sections are not explicitly stated in the input, you must automatically infer and assign them accurately based on standard educational curricula."
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response received from Gemini AI model.");
    }

    const syllabusData = JSON.parse(responseText.trim());
    res.json(syllabusData);

  } catch (err: any) {
    console.error("Gemini syllabus API Error: ", err);
    res.status(500).json({
      error: "Failed to extract syllabus using Gemini AI",
      details: err.message || err
    });
  }
});

const distributeSchema = {
  type: Type.ARRAY,
  description: "A list of chapter distribution mappings.",
  items: {
    type: Type.OBJECT,
    properties: {
      chapterId: {
        type: Type.STRING
      },
      dayIdx: {
        type: Type.NUMBER,
        description: "The 1-based index of the day to schedule this chapter for."
      }
    },
    required: ["chapterId", "dayIdx"]
  }
};

app.post("/api/gemini/auto-distribute", async (req, res) => {
  const { instructions, chapters, totalDays } = req.body;
  if (!chapters || !totalDays) return res.status(400).json({ error: "Missing parameters" });

  if (!ai) {
    // fallback random distribution
    const distributed = chapters.map((c: any, index: number) => ({
      chapterId: c.id,
      dayIdx: (index % totalDays) + 1
    }));
    return res.json(distributed);
  }

  try {
    const prompt = `You are a study routine distribution expert.
The user wants to distribute unassigned chapters across ${totalDays} study days.
User Instructions: "${instructions || "Evenly distribute the chapters."}"
Unassigned Chapters:
${JSON.stringify(chapters.map((c: any) => ({ id: c.id, name: c.chapterName, subject: c.subject, hours: c.estimatedHours, diff: c.difficulty })))}

Return a strict array mapping each chapter 'id' to a 'dayIdx' (between 1 and ${totalDays}). Ensure every chapter is returned precisely once.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ text: prompt }],
      config: {
        responseMimeType: "application/json",
        responseSchema: distributeSchema,
        systemInstruction: "You are a smart planner. Obey the user instructions when deciding on workload distributions. Respond with JSON only."
      }
    });

    res.json(JSON.parse(response.text!));
  } catch(e: any) {
    console.error("Distribute API failed", e);
    res.status(500).json({error: "Failed"});
  }
});

// Setup Vite Dev server / Production build server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in DEVELOPMENT mode, configuring Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode, serving static files...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
