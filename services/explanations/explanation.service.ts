import { ExplanationRequest, ExplanationResult } from '@/types/explanation.types';
import { ExplanationCache } from './explanation-cache';
import { ExplanationTemplates } from './explanation-templates';
import { ExplanationBuilder } from './explanation-builder';

const EXPLANATION_VERSION = 'v1.0.0-explanation';

export class ExplanationService {
  /**
   * Primary entry point for obtaining explanations.
   * Guarantees an instant response via Cache -> Template -> Async AI Upgrade.
   */
  static async getExplanation(req: ExplanationRequest): Promise<ExplanationResult> {
    // 1. Check Permanent Cache
    const cached = await ExplanationCache.get(
      req.userId, 
      req.mediaId, 
      req.mediaType, 
      EXPLANATION_VERSION
    );

    if (cached) {
      return cached;
    }

    // 2. Attempt Async AI Generation with Fallback
    const aiOutput = await ExplanationBuilder.humanizeWithAi(req);

    if (aiOutput) {
      // Async cache write (does not block caller)
      ExplanationCache.set(
        req.userId,
        req.mediaId,
        req.mediaType,
        aiOutput.short,
        aiOutput.medium,
        EXPLANATION_VERSION
      );

      return {
        shortExplanation: aiOutput.short,
        mediumExplanation: aiOutput.medium,
        isAiGenerated: true,
        cached: false,
        engineVersion: EXPLANATION_VERSION
      };
    }

    // 3. Fallback to Deterministic Template Engine
    const templateOutput = ExplanationTemplates.generate(req);

    return {
      shortExplanation: templateOutput.short,
      mediumExplanation: templateOutput.medium,
      isAiGenerated: false,
      cached: false,
      engineVersion: EXPLANATION_VERSION
    };
  }
}