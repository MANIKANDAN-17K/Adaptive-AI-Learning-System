/**
 * AWS Bedrock AI Service
 *
 * Manages all AI interactions using AWS Bedrock with Llama 4 Scout model.
 * Implements adaptive memory, behavior analysis, and slang mirroring.
 *
 * Features:
 * - Conversation memory (last 5 exchanges per session)
 * - Behavior & slang analysis
 * - Adaptive prompt building based on user characteristics
 * - IAM authentication
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from "@aws-sdk/client-bedrock-runtime";
import {
  PersonalityProfile,
  RoadmapNode,
  Skill,
  Session,
  PerformanceLog,
  Task,
  SessionContext,
  MentorMode,
} from "../types";

interface AnalysisResponse {
  question: string;
  response: string;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface BehaviorMetadata {
  tone: "formal" | "casual" | "mixed";
  confidence: "low" | "medium" | "high";
  slangLevel: "low" | "medium" | "high";
  primaryLanguage: "english" | "tamil" | "hindi" | "mixed";
}

export class BedrockAIService {
  private client: BedrockRuntimeClient;
  private modelId: string;
  private conversationMemory: Map<string, ConversationMessage[]> = new Map();
  private behaviorCache: Map<string, BehaviorMetadata> = new Map();
  private readonly MAX_MEMORY_MESSAGES = 10; // 5 exchanges (user + assistant)
  private readonly MAX_MEMORY_TOKENS = 2000;

  constructor() {
    // Initialize Bedrock client with IAM credentials from environment
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });

    this.modelId =
      process.env.BEDROCK_MODEL_ID || "meta.llama4-scout-17b-instruct-v1:0";

    console.log(`🚀 AWS Bedrock AI Service initialized`);
    console.log(`   Model: ${this.modelId}`);
    console.log(`   Region: ${process.env.AWS_REGION || "us-east-1"}`);
  }

  /**
   * Analyzes user message for behavior patterns and slang usage
   */
  private analyzeBehavior(userMessage: string): BehaviorMetadata {
    const lowerMessage = userMessage.toLowerCase();

    // Detect tone
    const formalIndicators = [
      "please",
      "kindly",
      "would you",
      "could you",
      "thank you",
    ];
    const casualIndicators = ["yeah", "yep", "nah", "gonna", "wanna", "kinda"];
    const formalCount = formalIndicators.filter((word) =>
      lowerMessage.includes(word),
    ).length;
    const casualCount = casualIndicators.filter((word) =>
      lowerMessage.includes(word),
    ).length;

    let tone: "formal" | "casual" | "mixed" = "mixed";
    if (formalCount > casualCount + 1) tone = "formal";
    else if (casualCount > formalCount) tone = "casual";

    // Detect confidence
    const lowConfidenceIndicators = [
      "not sure",
      "maybe",
      "i think",
      "confused",
      "help",
      "don't understand",
    ];
    const highConfidenceIndicators = [
      "i know",
      "definitely",
      "sure",
      "understand",
      "got it",
      "easy",
    ];
    const lowConfCount = lowConfidenceIndicators.filter((phrase) =>
      lowerMessage.includes(phrase),
    ).length;
    const highConfCount = highConfidenceIndicators.filter((phrase) =>
      lowerMessage.includes(phrase),
    ).length;

    let confidence: "low" | "medium" | "high" = "medium";
    if (lowConfCount > highConfCount) confidence = "low";
    else if (highConfCount > lowConfCount) confidence = "high";

    // Detect slang level
    const slangWords = [
      "bro",
      "dude",
      "cool",
      "awesome",
      "sick",
      "lit",
      "fire",
      "vibes",
      "lowkey",
      "highkey",
      "fr",
      "ngl",
      "tbh",
    ];
    const slangCount = slangWords.filter((word) =>
      lowerMessage.includes(word),
    ).length;

    let slangLevel: "low" | "medium" | "high" = "low";
    if (slangCount >= 3) slangLevel = "high";
    else if (slangCount >= 1) slangLevel = "medium";

    // Detect primary language (basic detection)
    const tamilIndicators = ["நான்", "என்", "இது", "அது"];
    const hindiIndicators = ["मैं", "है", "हूं", "का"];
    const hasTamil = tamilIndicators.some((word) => userMessage.includes(word));
    const hasHindi = hindiIndicators.some((word) => userMessage.includes(word));

    let primaryLanguage: "english" | "tamil" | "hindi" | "mixed" = "english";
    if (hasTamil && hasHindi) primaryLanguage = "mixed";
    else if (hasTamil) primaryLanguage = "tamil";
    else if (hasHindi) primaryLanguage = "hindi";
    else if (userMessage.match(/[^\x00-\x7F]/)) primaryLanguage = "mixed";

    return { tone, confidence, slangLevel, primaryLanguage };
  }

  /**
   * Builds adaptive system prompt based on user characteristics and context
   */
  private buildAdaptivePrompt(context: {
    userTone?: "formal" | "casual" | "mixed";
    confidence?: "low" | "medium" | "high";
    masteryScore?: number;
    slangLevel?: "low" | "medium" | "high";
    mentorMode?: MentorMode;
    currentTopic?: string;
    weakAreas?: string[];
  }): string {
    let prompt = "You are Mentra, an adaptive AI learning mentor. ";

    // Adapt based on confidence
    if (context.confidence === "low") {
      prompt +=
        "The learner is struggling. Be supportive, patient, and encouraging. Break down concepts into smaller steps. ";
    } else if (context.confidence === "high") {
      prompt +=
        "The learner is confident. Be motivating and introduce stretch challenges. Push them to think deeper. ";
    } else {
      prompt +=
        "The learner is progressing steadily. Maintain balanced guidance. ";
    }

    // Adapt based on mastery score
    if (context.masteryScore !== undefined) {
      if (context.masteryScore < 50) {
        prompt +=
          "Their mastery is below 50% - simplify explanations and provide more examples. ";
      } else if (context.masteryScore > 80) {
        prompt +=
          "Their mastery exceeds 80% - introduce advanced concepts and real-world applications. ";
      }
    }

    // Adapt based on slang level
    if (context.slangLevel === "high") {
      prompt +=
        'Mirror their casual, slang-heavy style naturally. Use phrases like "that\'s fire", "lowkey", "ngl". ';
    } else if (context.slangLevel === "low" || context.userTone === "formal") {
      prompt +=
        "Maintain professional, formal language. Avoid slang completely. ";
    }

    // Adapt based on mentor mode
    if (context.mentorMode) {
      const modeInstructions = {
        Professional: "Be professional, clear, and structured.",
        Friendly: "Be warm, conversational, and approachable.",
        Supportive: "Be encouraging, patient, and reassuring.",
        Challenger: "Be direct, challenging, and push for excellence.",
      };
      prompt += modeInstructions[context.mentorMode] + " ";
    }

    // Add topic context
    if (context.currentTopic) {
      prompt += `Current topic: ${context.currentTopic}. `;
    }

    // Add weak areas
    if (context.weakAreas && context.weakAreas.length > 0) {
      prompt += `Focus on these weak areas: ${context.weakAreas.join(", ")}. `;
    }

    prompt +=
      "Keep responses concise (2-4 sentences), structured, and actionable.";

    return prompt;
  }

  /**
   * Stores a conversation message in memory
   */
  private storeConversationMessage(
    sessionId: string,
    role: "user" | "assistant",
    content: string,
  ): void {
    if (!this.conversationMemory.has(sessionId)) {
      this.conversationMemory.set(sessionId, []);
    }

    const messages = this.conversationMemory.get(sessionId)!;
    messages.push({
      role,
      content,
      timestamp: new Date(),
    });

    // Keep only last MAX_MEMORY_MESSAGES
    if (messages.length > this.MAX_MEMORY_MESSAGES) {
      messages.splice(0, messages.length - this.MAX_MEMORY_MESSAGES);
    }
  }

  /**
   * Retrieves conversation history for a session
   */
  private getConversationHistory(sessionId: string): ConversationMessage[] {
    return this.conversationMemory.get(sessionId) || [];
  }

  /**
   * Formats conversation history for prompt injection
   */
  private formatConversationHistory(messages: ConversationMessage[]): string {
    if (messages.length === 0) return "";

    let formatted = "\n\nRecent conversation:\n";
    messages.forEach((msg) => {
      const label = msg.role === "user" ? "Learner" : "Mentor";
      formatted += `${label}: ${msg.content}\n`;
    });

    // Truncate if too long (rough token estimation: 1 token ≈ 4 chars)
    if (formatted.length > this.MAX_MEMORY_TOKENS * 4) {
      formatted = formatted.substring(
        formatted.length - this.MAX_MEMORY_TOKENS * 4,
      );
      formatted = "..." + formatted.substring(formatted.indexOf("\n"));
    }

    return formatted;
  }

  /**
   * Makes a request to AWS Bedrock
   * Supports both Llama and Claude models with automatic format detection
   */
  private async invokeBedrockModel(
    systemPrompt: string,
    userPrompt: string,
    temperature: number = 0.7,
    maxTokens: number = 500,
  ): Promise<string> {
    try {
      const isClaudeModel =
        this.modelId.includes("claude") || this.modelId.includes("anthropic");
      const isNovaModel = this.modelId.includes("nova");

      let input: InvokeModelCommandInput;

      if (isClaudeModel) {
        // Claude API format (Messages API with anthropic_version)
        input = {
          modelId: this.modelId,
          contentType: "application/json",
          accept: "application/json",
          body: JSON.stringify({
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: maxTokens,
            temperature: temperature,
            system: systemPrompt,
            messages: [
              {
                role: "user",
                content: userPrompt,
              },
            ],
          }),
        };
      } else if (isNovaModel) {
        // Amazon Nova API format (Messages API without anthropic_version, uses maxTokens)
        input = {
          modelId: this.modelId,
          contentType: "application/json",
          accept: "application/json",
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: [
                  {
                    text: `${systemPrompt}\n\n${userPrompt}`,
                  },
                ],
              },
            ],
            inferenceConfig: {
              maxTokens: maxTokens,
              temperature: temperature,
            },
          }),
        };
      } else {
        // Llama API format
        const fullPrompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

${systemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>

${userPrompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

`;

        input = {
          modelId: this.modelId,
          contentType: "application/json",
          accept: "application/json",
          body: JSON.stringify({
            prompt: fullPrompt,
            max_gen_len: maxTokens,
            temperature: temperature,
            top_p: 0.9,
          }),
        };
      }

      const command = new InvokeModelCommand(input);
      const response = await this.client.send(command);

      // Parse response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      // Debug logging for Nova responses
      if (isNovaModel) {
        console.log(
          "Nova response structure:",
          JSON.stringify(responseBody, null, 2),
        );
      }

      // Extract text based on model type
      let generatedText: string;

      if (isClaudeModel) {
        // Claude returns content array with text
        if (!responseBody.content || !responseBody.content[0]?.text) {
          throw new Error("INVALID_RESPONSE: Claude returned empty response");
        }
        generatedText = responseBody.content[0].text;
      } else if (isNovaModel) {
        // Amazon Nova returns output with message.content array
        if (
          !responseBody.output?.message?.content ||
          !responseBody.output.message.content[0]?.text
        ) {
          console.error(
            "Nova response body:",
            JSON.stringify(responseBody, null, 2),
          );
          throw new Error("INVALID_RESPONSE: Nova returned empty response");
        }
        generatedText = responseBody.output.message.content[0].text;
      } else {
        // Llama models return generation field
        if (!responseBody.generation) {
          throw new Error("INVALID_RESPONSE: Llama returned empty response");
        }
        generatedText = responseBody.generation;
      }

      return generatedText.trim();
    } catch (error: any) {
      console.error("Bedrock invocation error:", error);

      // Handle specific error types
      if (error.name === "ThrottlingException") {
        throw new Error("RATE_LIMIT: Too many requests to AI service");
      }

      if (error.name === "ServiceUnavailableException") {
        throw new Error(
          "SERVICE_UNAVAILABLE: AI service is temporarily unavailable",
        );
      }

      if (error.message?.includes("credentials")) {
        throw new Error("AUTH_ERROR: Invalid AWS credentials");
      }

      if (error.message?.includes("inference profile")) {
        throw new Error(
          "MODEL_ACCESS_ERROR: This model requires an inference profile ARN. Try using anthropic.claude-haiku-4-5-20251001-v1:0 instead.",
        );
      }

      // Generic error
      throw new Error(`BEDROCK_ERROR: ${error.message || "Unknown error"}`);
    }
  }

  /**
   * Generates a personalized learning roadmap for a skill
   */
  async generateRoadmap(
    skillName: string,
    goal: string,
    timeline: number,
    profile: PersonalityProfile,
  ): Promise<RoadmapNode[]> {
    try {
      const systemPrompt = this.buildAdaptivePrompt({
        mentorMode: "Professional",
      });

      const userPrompt = `Create a personalized learning roadmap for:

Skill: ${skillName}
Goal: ${goal}
Timeline: ${timeline} days
Learner Profile:
- Tone Type: ${profile.tone_type}
- Confidence Level: ${profile.confidence_level}
- Motivation Index: ${profile.motivation_index}

Generate 5-8 sequential learning nodes. Return ONLY valid JSON array:
[
  {
    "node_id": "node_1",
    "title": "Node Title",
    "description": "What to learn",
    "mastery_threshold": 75,
    "status": "current",
    "order": 1
  }
]

First node status="current", others="locked". Order 1,2,3... Thresholds 70-85.`;

      const response = await this.invokeBedrockModel(
        systemPrompt,
        userPrompt,
        0.7,
        800,
      );

      // Extract JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error(
          "PARSE_ERROR: Failed to parse roadmap from AI response",
        );
      }

      const roadmap: RoadmapNode[] = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(roadmap) || roadmap.length === 0) {
        throw new Error(
          "INVALID_ROADMAP: AI returned invalid roadmap structure",
        );
      }

      return roadmap;
    } catch (error) {
      console.error("Error generating roadmap:", error);
      throw error;
    }
  }

  /**
   * Conducts character analysis to determine personality profile
   */
  async conductCharacterAnalysis(
    responses: AnalysisResponse[],
  ): Promise<PersonalityProfile> {
    try {
      const systemPrompt =
        "You are a learning psychology expert. Analyze responses and return ONLY valid JSON.";

      const responsesText = responses
        .map((r) => `Q: ${r.question}\nA: ${r.response}`)
        .join("\n\n");

      const userPrompt = `Analyze these responses to determine learning personality:

${responsesText}

Determine:
1. tone_type: "formal", "casual", "encouraging", or "direct"
2. confidence_level: "low", "medium", or "high"
3. motivation_index: 0-100

Return ONLY valid JSON:
{
  "tone_type": "casual",
  "confidence_level": "medium",
  "motivation_index": 75
}`;

      const response = await this.invokeBedrockModel(
        systemPrompt,
        userPrompt,
        0.5,
        200,
      );

      // Extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("PARSE_ERROR: Failed to parse personality profile");
      }

      const profile = JSON.parse(jsonMatch[0]);

      if (
        !profile.tone_type ||
        !profile.confidence_level ||
        typeof profile.motivation_index !== "number"
      ) {
        throw new Error(
          "INVALID_PROFILE: AI returned invalid profile structure",
        );
      }

      return {
        user_id: "",
        tone_type: profile.tone_type,
        confidence_level: profile.confidence_level,
        motivation_index: profile.motivation_index,
      };
    } catch (error) {
      console.error("Error conducting character analysis:", error);
      throw error;
    }
  }

  /**
   * Generates a recap of the previous learning session
   */
  async generateRecap(
    skill: Skill,
    session: Session,
    performanceHistory: PerformanceLog[],
  ): Promise<string> {
    try {
      const recentPerformance = performanceHistory.slice(-5);
      const avgAccuracy =
        recentPerformance.length > 0
          ? recentPerformance.reduce((sum, p) => sum + p.accuracy, 0) /
            recentPerformance.length
          : 0;

      const systemPrompt =
        "You are an encouraging learning mentor. Be brief and motivating.";

      const userPrompt = `Generate a brief recap for a returning learner:

Skill: ${skill.skill_name}
Goal: ${skill.goal}
Last Session: ${session.recap_summary || "First session"}
Mastery Score: ${session.mastery_score}
Confidence: ${session.confidence_level}
Recent Accuracy: ${avgAccuracy.toFixed(1)}%

Write 2-3 encouraging sentences covering:
1. What they last covered
2. Current mastery level
3. Next action`;

      const response = await this.invokeBedrockModel(
        systemPrompt,
        userPrompt,
        0.7,
        150,
      );
      return response.trim();
    } catch (error) {
      console.error("Error generating recap:", error);
      throw error;
    }
  }

  /**
   * Generates a mentor response with adaptive memory and behavior analysis
   */
  async generateMentorResponse(
    userInput: string,
    context: SessionContext,
    mentorMode: MentorMode,
    difficulty: "simplified" | "standard" | "advanced",
    sessionId: string,
  ): Promise<string> {
    try {
      // Analyze user behavior
      const behavior = this.analyzeBehavior(userInput);
      this.behaviorCache.set(sessionId, behavior);

      // Store user message in memory
      this.storeConversationMessage(sessionId, "user", userInput);

      // Get conversation history
      const history = this.getConversationHistory(sessionId);
      const historyText = this.formatConversationHistory(history);

      // Build adaptive system prompt
      const systemPrompt = this.buildAdaptivePrompt({
        userTone: behavior.tone,
        confidence: behavior.confidence,
        masteryScore: context.masteryScore,
        slangLevel: behavior.slangLevel,
        mentorMode: mentorMode,
        currentTopic: context.currentNode.title,
      });

      const difficultyInstructions = {
        simplified: "Simplify concepts, use more examples, slow down pacing.",
        standard: "Maintain normal difficulty and pacing.",
        advanced: "Increase complexity, introduce advanced concepts.",
      };

      const userPrompt = `Current Node: ${context.currentNode.title}
Description: ${context.currentNode.description}
Mastery: ${context.masteryScore}
Confidence: ${context.confidenceLevel}
Difficulty: ${difficulty} - ${difficultyInstructions[difficulty]}
${historyText}

Learner's message: "${userInput}"

Respond as the mentor. Be focused and actionable (2-4 sentences).`;

      const response = await this.invokeBedrockModel(
        systemPrompt,
        userPrompt,
        0.8,
        200,
      );

      // Store assistant response in memory
      this.storeConversationMessage(sessionId, "assistant", response);

      return response.trim();
    } catch (error) {
      console.error("Error generating mentor response:", error);
      throw error;
    }
  }

  /**
   * Generates an optional stretch task for high-performing learners
   */
  async generateStretchTask(
    currentNode: RoadmapNode,
    masteryScore: number,
  ): Promise<Task> {
    try {
      const systemPrompt =
        "You are an expert at creating challenging learning tasks.";

      const userPrompt = `Learner achieved ${masteryScore}% mastery on:

Topic: ${currentNode.title}
Description: ${currentNode.description}

Create an optional advanced challenge that:
1. Goes beyond current scope
2. Connects to real-world applications
3. Requires creative thinking
4. Is clearly more challenging

Provide clear task description (2-3 sentences).`;

      const response = await this.invokeBedrockModel(
        systemPrompt,
        userPrompt,
        0.8,
        150,
      );

      return {
        id: `stretch_${Date.now()}`,
        description: response.trim(),
        isStretch: true,
      };
    } catch (error) {
      console.error("Error generating stretch task:", error);
      throw error;
    }
  }

  /**
   * Clears conversation memory for a session (useful for testing or session end)
   */
  clearSessionMemory(sessionId: string): void {
    this.conversationMemory.delete(sessionId);
    this.behaviorCache.delete(sessionId);
  }

  /**
   * Gets behavior metadata for a session
   */
  getSessionBehavior(sessionId: string): BehaviorMetadata | undefined {
    return this.behaviorCache.get(sessionId);
  }
}
