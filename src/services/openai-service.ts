/**
 * openai-service.ts - OpenAI DALL-E 图片生成服务
 * 官方文档：https://platform.openai.com/docs/api-reference/images
 */

import type { GenerateRequest, GenerateResponse } from '../types/wallpaper'
import { BaseAiService, type ProviderConfig, PROVIDERS } from './ai-service'

// ============================================
// OpenAI API 类型定义
// ============================================

/** OpenAI 图片生成请求 */
interface OpenAiImageRequest {
  model: string
  prompt: string
  n?: number
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
  response_format?: 'url' | 'b64_json'
}

/** OpenAI 图片生成响应 */
interface OpenAiImageResponse {
  created: number
  data: Array<{
    url?: string
    b64_json?: string
    revised_prompt?: string
  }>
}

/** OpenAI 错误响应 */
interface OpenAiErrorResponse {
  error: {
    message: string
    type: string
    code: string
  }
}

// ============================================
// OpenAI 服务实现
// ============================================

export class OpenAiService extends BaseAiService {
  readonly providerId = 'openai' as const
  
  private readonly baseUrl = 'https://api.openai.com/v1/images/generations'
  
  /** 生成图片 */
  async generate(request: GenerateRequest, config: ProviderConfig): Promise<GenerateResponse> {
    try {
      // 验证配置
      if (!this.validateConfig(config)) {
        return {
          success: false,
          error: 'API Key 未配置或无效'
        }
      }
      
      // 构建提示词
      const enhancedPrompt = this.buildPrompt(request)
      
      // DALL-E 3 有 4000 字符限制
      const prompt = enhancedPrompt.slice(0, 4000)
      
      // 解析分辨率
      const size = this.convertResolution(request.resolution, config.model)
      
      // 构建 API 请求
      const apiRequest: OpenAiImageRequest = {
        model: config.model || PROVIDERS.openai.defaultModel,
        prompt,
        n: 1,
        size,
        quality: 'standard',
        style: 'vivid',
        response_format: 'url'
      }
      
      // 调用 API
      const response = await fetch(config.baseUrl || this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(apiRequest)
      })
      
      if (!response.ok) {
        const error: OpenAiErrorResponse = await response.json()
        return {
          success: false,
          error: error.error?.message || `API 请求失败 (${response.status})`
        }
      }
      
      const result: OpenAiImageResponse = await response.json()
      
      if (result.data?.[0]?.url) {
        return {
          success: true,
          wallpaper: {
            id: `openai-${Date.now()}`,
            source: 'ai',
            prompt: result.data[0].revised_prompt || prompt,
            imageUrl: result.data[0].url,
            thumbnailUrl: result.data[0].url,
            resolution: request.resolution,
            style: 'pixel',
            scene: request.scene,
            pixelConfig: request.pixelConfig,
            colorMode: request.colorMode,
            composition: request.composition,
            createdAt: new Date().toISOString(),
            isFavorite: false
          },
          usage: {
            tokens: 1,
            cost: config.model === 'dall-e-3' ? 0.04 : 0.02  // DALL-E 3 约 $0.04/张
          }
        }
      }
      
      return {
        success: false,
        error: '生成失败，未返回图片'
      }
      
    } catch (error) {
      console.error('OpenAI 生成失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误，请检查网络连接'
      }
    }
  }
  
  /** 转换分辨率为 OpenAI 支持的尺寸 */
  private convertResolution(resolution: string, model?: string): '1024x1024' | '1792x1024' | '1024x1792' {
    const { width, height } = this.parseResolution(resolution)
    
    // DALL-E 2 只支持 256x256, 512x512, 1024x1024
    if (model === 'dall-e-2') {
      return '1024x1024'
    }
    
    // DALL-E 3 支持 1024x1024, 1792x1024, 1024x1792
    const ratio = width / height
    
    if (ratio > 1.3) {
      return '1792x1024'  // 横屏
    } else if (ratio < 0.77) {
      return '1024x1792'  // 竖屏
    }
    
    return '1024x1024'  // 正方形
  }
  
  /** 验证配置 */
  validateConfig(config: ProviderConfig): boolean {
    return !!(
      config.apiKey && 
      config.apiKey.startsWith('sk-') && 
      config.apiKey.length > 20 &&
      config.enabled
    )
  }
}

// 导出单例
export const openAiService = new OpenAiService()
