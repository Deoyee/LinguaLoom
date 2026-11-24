// Topic presets with rich multi-lingual translations
const THEMED_TOPIC_PACKS = {
  travel: {
    title: "Travel & Airport Navigation",
    icon: "✈️",
    vocab: [
      { English: "Passport", Spanish: "Pasaporte", French: "Passeport", German: "Reisepass" },
      { English: "Boarding pass", Spanish: "Tarjeta de embarque", French: "Carte d'embarquement", German: "Bordkarte" },
      { English: "Flight", Spanish: "Vuelo", French: "Vol", German: "Flug" },
      { English: "Luggage", Spanish: "Equipaje", French: "Bagages", German: "Gepäck" },
      { English: "Customs", Spanish: "Aduana", French: "Douane", German: "Zoll" },
      { English: "Gate", Spanish: "Puerta de embarque", French: "Porte", German: "Tor / Gate" },
    ],
    questions: [
      {
        prompt: "Where is boarding gate 12?",
        translations: {
          Spanish: "¿Dónde está la puerta de embarque 12?",
          French: "Où se trouve la porte d'embarquement 12 ?",
          German: "Wo ist Flugsteig 12?",
          English: "Where is boarding gate 12?",
        },
      },
      {
        prompt: "Here is my passport and boarding pass.",
        translations: {
          Spanish: "Aquí tiene mi pasaporte y tarjeta de embarque.",
          French: "Voici mon passeport et ma carte d'embarquement.",
          German: "Hier ist mein Reisepass und meine Bordkarte.",
          English: "Here is my passport and boarding pass.",
        },
      },
    ],
  },
  food: {
    title: "Food, Cafe & Dining Out",
    icon: "🍕",
    vocab: [
      { English: "Menu", Spanish: "Menú", French: "Menu", German: "Speisekarte" },
      { English: "Bill / Check", Spanish: "La cuenta", French: "L'addition", German: "Die Rechnung" },
      { English: "Delicious", Spanish: "Delicioso", French: "Délicieux", German: "Köstlich" },
      { English: "Spicy", Spanish: "Picante", French: "Épicé", German: "Scharf" },
      { English: "Vegetarian", Spanish: "Vegetariano", French: "Végétarien", German: "Vegetarisch" },
      { English: "Breakfast", Spanish: "Desayuno", French: "Petit-déjeuner", German: "Frühstück" },
    ],
    questions: [
      {
        prompt: "Could we have the bill, please?",
        translations: {
          Spanish: "¿Nos trae la cuenta, por favor?",
          French: "L'addition, s'il vous plaît ?",
          German: "Können wir bitte die Rechnung haben?",
          English: "Could we have the bill, please?",
        },
      },
      {
        prompt: "Do you have any vegetarian dishes?",
        translations: {
          Spanish: "¿Tienen algún plato vegetariano?",
          French: "Avez-vous des plats végétariens ?",
          German: "Haben Sie vegetarische Gerichte?",
          English: "Do you have any vegetarian dishes?",
        },
      },
    ],
  },
  tech: {
    title: "Technology & Daily Work",
    icon: "💻",
    vocab: [
      { English: "Computer", Spanish: "Computadora", French: "Ordinateur", German: "Computer" },
      { English: "Website", Spanish: "Sitio web", French: "Site web", German: "Webseite" },
      { English: "Meeting", Spanish: "Reunión", French: "Réunion", German: "Besprechung" },
      { English: "Project", Spanish: "Proyecto", French: "Projet", German: "Projekt" },
      { English: "Deadline", Spanish: "Fecha límite", French: "Date limite", German: "Frist" },
      { English: "Email", Spanish: "Correo electrónico", French: "E-mail", German: "E-Mail" },
    ],
    questions: [
      {
        prompt: "Let's discuss the project tomorrow morning.",
        translations: {
          Spanish: "Hablemos del proyecto mañana por la mañana.",
          French: "Discutons du projet demain matin.",
          German: "Lass uns das Projekt morgen früh besprechen.",
          English: "Let's discuss the project tomorrow morning.",
        },
      },
    ],
  },
  social: {
    title: "Dating, Friendship & Nightlife",
    icon: "🎉",
    vocab: [
      { English: "Music", Spanish: "Música", French: "Musique", German: "Musik" },
      { English: "Dance", Spanish: "Bailar", French: "Danser", German: "Tanzen" },
      { English: "Drink", Spanish: "Bebida", French: "Boisson", German: "Getränk" },
      { English: "Fun", Spanish: "Divertido", French: "Amusant", German: "Spaß" },
      { English: "Weekend", Spanish: "Fin de semana", French: "Week-end", German: "Wochenende" },
      { English: "Compliment", Spanish: "Cumplido", French: "Compliment", German: "Kompliment" },
    ],
    questions: [
      {
        prompt: "Are you free this weekend?",
        translations: {
          Spanish: "¿Estás libre este fin de semana?",
          French: "Es-tu libre ce week-end ?",
          German: "Hast du dieses Wochenende Zeit?",
          English: "Are you free this weekend?",
        },
      },
    ],
  },
};

export async function generatePracticeLesson(req, res) {
  try {
    const { topic = "Travel", targetLanguage = "Spanish", nativeLanguage = "English", level = "Intermediate" } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. If Gemini API Key is provided, use Google Gemini
    if (apiKey) {
      try {
        const prompt = `You are an expert language teacher in LinguaLoom.
Generate a structured, engaging language lesson for learning "${targetLanguage}" from "${nativeLanguage}".
Topic: "${topic}".
Level: "${level}".

Return ONLY a raw JSON object (no markdown code fences, no extra text) with this schema:
{
  "topic": "${topic}",
  "overview": "Engaging 1-sentence overview of the lesson",
  "questions": [
    {
      "id": "gen-q1",
      "type": "choice",
      "prompt": "Sentence in ${nativeLanguage}",
      "targetAnswer": "Translation in ${targetLanguage}",
      "options": ["Translation in ${targetLanguage}", "Wrong option 1", "Wrong option 2", "Wrong option 3"]
    },
    {
      "id": "gen-q2",
      "type": "type",
      "prompt": "Sentence in ${nativeLanguage}",
      "targetAnswer": "Translation in ${targetLanguage}"
    },
    {
      "id": "gen-q3",
      "type": "choice",
      "prompt": "Sentence in ${nativeLanguage}",
      "targetAnswer": "Translation in ${targetLanguage}",
      "options": ["Translation in ${targetLanguage}", "Wrong option 1", "Wrong option 2", "Wrong option 3"]
    },
    {
      "id": "gen-q4",
      "type": "type",
      "prompt": "Sentence in ${nativeLanguage}",
      "targetAnswer": "Translation in ${targetLanguage}"
    }
  ],
  "vocabulary": [
    { "id": "gv1", "native": "Word 1 in ${nativeLanguage}", "target": "Word 1 in ${targetLanguage}", "context": "Usage context" },
    { "id": "gv2", "native": "Word 2 in ${nativeLanguage}", "target": "Word 2 in ${targetLanguage}", "context": "Usage context" },
    { "id": "gv3", "native": "Word 3 in ${nativeLanguage}", "target": "Word 3 in ${targetLanguage}", "context": "Usage context" },
    { "id": "gv4", "native": "Word 4 in ${nativeLanguage}", "target": "Word 4 in ${targetLanguage}", "context": "Usage context" }
  ],
  "scenario": {
    "title": "Interactive dialogue title for ${topic}",
    "characterName": "Local Character Name",
    "characterRole": "Role (e.g. Host, Guide, Partner)",
    "steps": [
      {
        "characterText": "Opening sentence in ${targetLanguage}",
        "characterTextNative": "Translation in ${nativeLanguage}",
        "options": [
          { "id": "opt-1", "target": "Good response in ${targetLanguage}", "native": "Meaning in ${nativeLanguage}", "feedback": "Natural reply!" },
          { "id": "opt-2", "target": "Casual response in ${targetLanguage}", "native": "Meaning in ${nativeLanguage}", "feedback": "Friendly and direct!" }
        ]
      },
      {
        "characterText": "Follow up sentence in ${targetLanguage}",
        "characterTextNative": "Translation in ${nativeLanguage}",
        "options": [
          { "id": "opt-3", "target": "Response in ${targetLanguage}", "native": "Meaning in ${nativeLanguage}", "feedback": "Well done!" }
        ]
      }
    ]
  }
}`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const cleanedText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleanedText);
          return res.status(200).json({ success: true, isAi: true, data: parsed });
        }
      } catch (geminiError) {
        console.warn("Gemini API call failed, falling back to algorithmic curriculum:", geminiError.message);
      }
    }

    // 2. Intelligent Built-in Curriculum Fallback (Instantly responds on any topic)
    const topicKey = topic.toLowerCase().includes("food") || topic.toLowerCase().includes("cafe")
      ? "food"
      : topic.toLowerCase().includes("tech") || topic.toLowerCase().includes("work")
      ? "tech"
      : topic.toLowerCase().includes("night") || topic.toLowerCase().includes("dating") || topic.toLowerCase().includes("friend")
      ? "social"
      : "travel";

    const pack = THEMED_TOPIC_PACKS[topicKey] || THEMED_TOPIC_PACKS.travel;

    const formattedQuestions = pack.questions.map((q, idx) => {
      const targetAns = q.translations[targetLanguage] || q.translations.Spanish || q.prompt;
      return {
        id: `fb-q${idx}`,
        type: idx % 2 === 0 ? "choice" : "type",
        prompt: q.prompt,
        targetAnswer: targetAns,
        options: [
          targetAns,
          `No ${targetAns}`,
          `Por favor, ${targetAns}`,
          `Muchas gracias`,
        ],
      };
    });

    const formattedVocab = pack.vocab.map((v, idx) => ({
      id: `fb-v${idx}`,
      native: v[nativeLanguage] || v.English,
      target: v[targetLanguage] || v.Spanish || v.English,
      context: `Useful phrase in ${topic}`,
    }));

    const result = {
      topic: `${pack.icon} ${pack.title}`,
      overview: `Practical phrases and dynamic conversation practice for ${topic}.`,
      questions: formattedQuestions,
      vocabulary: formattedVocab,
      scenario: {
        title: pack.title,
        characterName: "Elena",
        characterRole: "Local Conversationalist",
        steps: [
          {
            characterText: pack.questions[0]?.translations[targetLanguage] || "¡Hola! ¿Cómo estás hoy?",
            characterTextNative: pack.questions[0]?.prompt || "Hello! How are you today?",
            options: [
              {
                id: "fb-opt-1",
                target: "Muy bien, gracias. ¿Y tú?",
                native: "Very well, thank you. And you?",
                feedback: "Friendly and natural greeting!",
              },
            ],
          },
        ],
      },
    };

    return res.status(200).json({ success: true, isAi: false, data: result });
  } catch (error) {
    console.error("Error generating practice lesson:", error);
    res.status(500).json({ message: "Failed to generate lesson pack" });
  }
}
