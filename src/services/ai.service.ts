import prisma from '../config/database';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';

export class AIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      logger.warn('GEMINI_API_KEY is not configured, AI features will be disabled');
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  private ensureConfigured() {
    if (!process.env.GEMINI_API_KEY) {
      throw new AppError(500, 'AI features are not configured. Please set GEMINI_API_KEY.');
    }
  }

  async generateContent(prompt: string, context?: string) {
    this.ensureConfigured();

    try {
      const fullPrompt = context
        ? `Context: ${context}\n\nTask: ${prompt}`
        : prompt;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return {
        content: text,
        model: 'gemini-pro',
      };
    } catch (error: any) {
      logger.error('Gemini API error:', error);
      throw new AppError(500, 'Failed to generate content');
    }
  }

  async continueWriting(currentContent: string) {
    this.ensureConfigured();
    const prompt = `Continue the following text in a natural and coherent way:\n\n${currentContent}`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      continuation: text,
      model: 'gemini-pro',
    };
  }

  async summarizeDocument(content: string) {
    this.ensureConfigured();
    // Convert JSON content to text if needed
    let textContent = content;
    if (typeof content === 'object') {
      textContent = JSON.stringify(content);
    }

    const prompt = `Summarize the following content concisely, highlighting the main points:\n\n${textContent}`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      summary: text,
      model: 'gemini-pro',
    };
  }

  async expandSection(section: string, topic: string) {
    this.ensureConfigured();
    const prompt = `Expand on this topic: "${topic}". Current content:\n\n${section}\n\nProvide additional details, examples, and insights.`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      expansion: text,
      model: 'gemini-pro',
    };
  }

  async fixGrammar(text: string) {
    this.ensureConfigured();
    const prompt = `Fix grammar, spelling, and improve readability while maintaining the original meaning and tone:\n\n${text}`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const correctedText = response.text();

    return {
      correctedText,
      model: 'gemini-pro',
    };
  }

  async generateBlogPost(topic: string, tone: 'formal' | 'casual' | 'professional' = 'professional') {
    this.ensureConfigured();
    const prompt = `Write a comprehensive blog post about "${topic}" in a ${tone} tone. Include an introduction, main body with key points, and a conclusion.`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    return {
      content,
      model: 'gemini-pro',
    };
  }

  async generateOutline(topic: string) {
    this.ensureConfigured();
    const prompt = `Create a detailed outline for an article or document about "${topic}". Include main sections and subsections with bullet points.`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const outline = response.text();

    return {
      outline,
      model: 'gemini-pro',
    };
  }

  async saveGeneration(noteId: string, prompt: string, generatedContent: any, model: string) {
    try {
      const generation = await prisma.aIGeneration.create({
        data: {
          noteId,
          prompt,
          generatedContent,
          model,
        },
      });

      return generation;
    } catch (error) {
      logger.error('Failed to save AI generation:', error);
      // Don't throw error here as it's not critical
      return null;
    }
  }

  async getGenerationHistory(noteId: string) {
    const generations = await prisma.aIGeneration.findMany({
      where: { noteId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return generations;
  }
}

export default new AIService();
