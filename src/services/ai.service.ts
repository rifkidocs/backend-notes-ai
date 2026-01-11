import axios from 'axios';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';

export class AIService {
  private apiKey: string;
  private baseURL: string = 'https://api.z.ai/api/paas/v4';
  private model: string = 'glm-4.7';

  constructor() {
    this.apiKey = process.env.ZAI_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('ZAI_API_KEY is not configured, AI features will be disabled');
    }
  }

  private ensureConfigured() {
    if (!this.apiKey) {
      throw new AppError(500, 'AI features are not configured. Please set ZAI_API_KEY.');
    }
  }

  private async callChatAPI(messages: { role: string; content: string }[]) {
    this.ensureConfigured();

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      const content = response.data.choices[0].message.content;
      return {
        content,
        model: this.model,
      };
    } catch (error: any) {
      logger.error('Z.AI API error:', error.response?.data || error.message);
      throw new AppError(500, 'Failed to generate content with Z.AI');
    }
  }

  async generateContent(prompt: string, context?: string) {
    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant.' },
      {
        role: 'user',
        content: context ? `Context: ${context}\n\nTask: ${prompt}` : prompt
      }
    ];

    return this.callChatAPI(messages);
  }

  async continueWriting(currentContent: string) {
    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant. Continue the user\'s text naturally.' },
      { role: 'user', content: `Continue the following text in a natural and coherent way:\n\n${currentContent}` }
    ];

    const result = await this.callChatAPI(messages);
    return {
      continuation: result.content,
      model: this.model,
    };
  }

  async summarizeDocument(content: string) {
    let textContent = content;
    if (typeof content === 'object') {
      textContent = JSON.stringify(content);
    }

    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant that summarizes documents.' },
      { role: 'user', content: `Summarize the following content concisely, highlighting the main points:\n\n${textContent}` }
    ];

    const result = await this.callChatAPI(messages);
    return {
      summary: result.content,
      model: this.model,
    };
  }

  async expandSection(section: string, topic: string) {
    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant.' },
      { role: 'user', content: `Expand on this topic: "${topic}". Current content:\n\n${section}\n\nProvide additional details, examples, and insights.` }
    ];

    const result = await this.callChatAPI(messages);
    return {
      expansion: result.content,
      model: this.model,
    };
  }

  async fixGrammar(text: string) {
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant. Fix grammar, spelling, and improve readability. Return ONLY the corrected text without any introductory phrases, explanations, or markdown formatting.'
      },
      { role: 'user', content: text }
    ];

    const result = await this.callChatAPI(messages);
    return {
      correctedText: result.content,
      model: this.model,
    };
  }

  async generateBlogPost(topic: string, tone: 'formal' | 'casual' | 'professional' = 'professional') {
    const messages = [
      { role: 'system', content: `You are a professional blog writer. Use a ${tone} tone.` },
      { role: 'user', content: `Write a comprehensive blog post about "${topic}". Include an introduction, main body with key points, and a conclusion.` }
    ];

    return this.callChatAPI(messages);
  }

  async generateOutline(topic: string) {
    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant.' },
      { role: 'user', content: `Create a detailed outline for an article or document about "${topic}". Include main sections and subsections with bullet points.` }
    ];

    const result = await this.callChatAPI(messages);
    return {
      outline: result.content,
      model: this.model,
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