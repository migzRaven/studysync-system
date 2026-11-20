const { GoogleGenAI } = require('@google/genai');
const Flashcard = require('../models/Flashcard');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const generateFlashcards = async (req, res) => {
  const { noteId, noteContent, subjectId } = req.body;

  try {
    await Flashcard.deleteMany({ note: noteId, user: req.user._id });

    const prompt = `You are a study assistant. Read the following note and create 3 to 5 high-quality flashcards. 
    Return ONLY a raw JSON array. Do not include markdown formatting like \`\`\`json or \`\`\`.
    Format exactly like this: [{"question": "Question here?", "answer": "Answer here."}]
    
    Note content: ${noteContent}`;

    // Using the most stable model name
    const response = await ai.models.generateContent({
                  model: 'gemini-3.8-flash',
      contents: prompt,
    });

    let responseText = response.text;
    
    // Clean up markdown backticks if any
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const flashcardsData = JSON.parse(responseText);

    const savedCards = [];
    for (let card of flashcardsData) {
      const newCard = await Flashcard.create({
        question: card.question,
        answer: card.answer,
        note: noteId,
        subject: subjectId,
        user: req.user._id
      });
      savedCards.push(newCard);
    }

    res.status(201).json(savedCards);
  } catch (error) {
    // This will print the EXACT error in your backend terminal
    console.error("=== AI GENERATION ERROR ===");
    console.error(error); 
    console.error("===========================");
    
    res.status(500).json({ message: 'AI failed to generate flashcards.' });
  }
};

const getFlashcardsByNote = async (req, res) => {
  try {
    const cards = await Flashcard.find({ note: req.params.noteId, user: req.user._id });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { generateFlashcards, getFlashcardsByNote };