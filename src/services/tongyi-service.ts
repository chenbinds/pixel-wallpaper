/**
 * tongyi-service.ts - 通义万相（阿里云 DashScope）图片生成服务
 * 官方文档：https://help.aliyun.com/zh/dashscope/developer-reference/api-details-9
 */

import type { GenerateRequest, GenerateResponse } from '../types/wallpaper'
import { BaseAiService, type ProviderConfig, PROVIDERS } from './ai-service'

// ============================================
// 通义万相 API 类型定义
// ============================================

/** 通义万相 API 请求 */
interface TongyiApiRequest {
  model: string
  input: {
    prompt: string
    negative_prompt?: string
  }
  parameters: {
    size: string
    n: number
    style?: string
  }
}

/** 通义万相 API 响应 */
interface TongyiApiResponse {
  request_id: string
  output: {
    task_id: string
    task_status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'
    results?: Array<{
      url: string
    }>
    submit_time?: string
    finish_time?: string
  }
  usage?: {
    image_count: number
  }
  code?: string
  message?: string
}

/** 通义万相任务查询响应 */
interface TongyiTaskResponse {
  request_id: string
  output: {
    task_id: string
    task_status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'
    results?: Array<{
      url: string
    }>
    submit_time: string
    finish_time?: string
  }
  usage?: {
    image_count: number
  }
  code?: string
  message?: string
}

// ============================================
// 通义万相服务实现
// ============================================

export class TongyiService extends BaseAiService {
  readonly providerId = 'tongyi' as const
  
  private readonly baseUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis'
  private readonly taskUrl = 'https://dashscope.aliyuncs.com/api/v1/tasks/'
  
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
      
      // 解析分辨率，转换为通义万相支持的尺寸
      const size = this.convertResolution(request.resolution)
      
      // 构建 API 请求
      const apiRequest: TongyiApiRequest = {
        model: config.model || PROVIDERS.tongyi.defaultModel,
        input: {
          prompt: enhancedPrompt,
          negative_prompt: request.negativePrompt || 'blurry, low quality, distorted, ugly, bad anatomy'
        },
        parameters: {
          size,
          n: 1,
          style: '<auto>'  // 自动风格
        }
      }
      
      // 调用 API（异步任务模式）
      const response = await this.callApi(apiRequest, config.apiKey)
      
      // 检查是否需要轮询等待结果
      if (response.output.task_status === 'PENDING' || response.output.task_status === 'RUNNING') {
        // 轮询等待任务完成
        const result = await this.pollTaskResult(response.output.task_id, config.apiKey)
        
        if (!result.success) {
          return result
        }
        
        return result
      }
      
      // 直接返回结果
      if (response.output.task_status === 'SUCCEEDED' && response.output.results?.[0]) {
        return {
          success: true,
          wallpaper: {
            id: response.request_id,
            source: 'ai',
            prompt: enhancedPrompt,
            imageUrl: response.output.results[0].url,
            thumbnailUrl: response.output.results[0].url,
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
            tokens: response.usage?.image_count || 1,
            cost: 0.15  // 估算成本
          }
        }
      }
      
      return {
        success: false,
        error: response.message || '生成失败，请重试'
      }
      
    } catch (error) {
      console.error('通义万相生成失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误，请检查网络连接'
      }
    }
  }
  
  /** 调用通义万相 API */
  private async callApi(request: TongyiApiRequest, apiKey: string): Promise<TongyiApiResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-DashScope-Async': 'enable'  // 启用异步模式
      },
      body: JSON.stringify(request)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API 请求失败 (${response.status}): ${errorText}`)
    }
    
    return response.json()
  }
  
  /** 轮询任务结果 */
  private async pollTaskResult(taskId: string, apiKey: string, maxAttempts: number = 60): Promise<GenerateResponse> {
    for (let i = 0; i < maxAttempts; i++) {
      // 等待 2 秒
      await this.sleep(2000)
      
      try {
        const response = await fetch(`${this.taskUrl}${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        })
        
        if (!response.ok) {
          continue
        }
        
        const result: TongyiTaskResponse = await response.json()
        
        if (result.output.task_status === 'SUCCEEDED' && result.output.results?.[0]) {
          return {
            success: true,
            wallpaper: {
              id: result.request_id,
              source: 'ai',
              prompt: '',  // 由调用方填充
              imageUrl: result.output.results[0].url,
              thumbnailUrl: result.output.results[0].url,
              resolution: '1024x1024',
              style: 'pixel',
              scene: 'fc_retro',
              colorMode: { tone: 'colorful' },
              pixelConfig: { density: '16bit', styleRef: 'fc', perspective: 'side_scroll' },
              composition: 'center',
              createdAt: new Date().toISOString(),
              isFavorite: false
            },
            usage: {
              tokens: result.usage?.image_count || 1,
              cost: 0.15
            }
          }
        }
        
        if (result.output.task_status === 'FAILED') {
          return {
            success: false,
            error: result.message || '生成任务失败'
          }
        }
        
      } catch (error) {
        console.error('轮询任务状态失败:', error)
      }
    }
    
    return {
      success: false,
      error: '生成超时，请重试'
    }
  }
  
  /** 转换分辨率为通义万相支持的尺寸格式 */
  private convertResolution(resolution: string): string {
    const { width, height } = this.parseResolution(resolution)
    
    // 通义万相支持的尺寸: 512x512, 720x720, 1024x1024, 1024x720, 720x1024, 1024x1792, 1792x1024
    if (width === height) {
      if (width <= 512) return '512*512'
      if (width <= 720) return '720*720'
      return '1024*1024'
    }
    
    // 横屏
    if (width > height) {
      if (width >= 1792) return '1792*1024'
      return '1024*720'
    }
    
    // 竖屏
    if (height >= 1792) return '1024*1792'
    return '720*1024'
  }
  
  /** 睡眠函数 */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  /** 验证配置 */
  validateConfig(config: ProviderConfig): boolean {
    return !!(
      config.apiKey && 
      config.apiKey.startsWith('sk-') && 
      config.apiKey.length > 10 &&
      config.enabled
    )
  }
}

// 导出单例
export const tongyiService = new TongyiService()
