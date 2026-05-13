/**
 * tongyi-service.ts - 通义万相（阿里云 DashScope）图片生成服务
 * 官方文档：https://help.aliyun.com/zh/model-studio/wan-image-generation-and-editing-api-reference
 * 
 * 支持 wan2.7-image-pro / wan2.7-image（同步接口）
 * 支持 wanx-v1（异步接口，旧版兼容）
 */

import type { GenerateRequest, GenerateResponse } from '../types/wallpaper'
import { BaseAiService, type ProviderConfig, PROVIDERS } from './ai-service'

// ============================================
// wan2.7 同步接口类型定义
// ============================================

/** wan2.7 同步 API 请求 */
interface Wan27SyncRequest {
  model: string
  input: {
    messages: Array<{
      role: string
      content: Array<{ text?: string; image?: string }>
    }>
  }
  parameters?: {
    size?: string
    n?: number
    watermark?: boolean
  }
}

/** wan2.7 同步 API 响应 */
interface Wan27SyncResponse {
  request_id: string
  output?: {
    choices?: Array<{
      finish_reason: string
      message: {
        role: string
        content: Array<{
          type: string
          image?: string
          text?: string
        }>
      }
    }>
    finished?: boolean
  }
  usage?: {
    image_count: number
    size: string
    total_tokens: number
  }
  code?: string
  message?: string
}

// ============================================
// wanx-v1 异步接口类型定义（旧版兼容）
// ============================================

/** wanx-v1 异步 API 请求 */
interface WanxV1Request {
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

/** wanx-v1 异步 API 响应 */
interface WanxV1Response {
  request_id: string
  output: {
    task_id: string
    task_status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'
    results?: Array<{ url: string }>
  }
  usage?: { image_count: number }
  code?: string
  message?: string
}

/** wanx-v1 任务查询响应 */
interface WanxV1TaskResponse {
  request_id: string
  output: {
    task_id: string
    task_status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'
    results?: Array<{ url: string }>
  }
  usage?: { image_count: number }
  code?: string
  message?: string
}

// ============================================
// 通义万相服务实现
// ============================================

export class TongyiService extends BaseAiService {
  readonly providerId = 'tongyi' as const

  // wan2.7 同步接口地址
  private readonly syncUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
  // wanx-v1 异步接口地址
  private readonly asyncUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis'
  // 任务查询地址
  private readonly taskUrl = 'https://dashscope.aliyuncs.com/api/v1/tasks/'

  /** 生成图片 */
  async generate(request: GenerateRequest, config: ProviderConfig): Promise<GenerateResponse> {
    try {
      if (!this.validateConfig(config)) {
        return { success: false, error: 'API Key 未配置或无效' }
      }

      const enhancedPrompt = this.buildPrompt(request)
      const model = config.model || PROVIDERS.tongyi.defaultModel

      // 判断使用新版（wan2.7）还是旧版（wanx-v1）接口
      if (model.startsWith('wan2.') || model.startsWith('wanx2.')) {
        return await this.generateSync(request, enhancedPrompt, model, config.apiKey)
      } else {
        return await this.generateAsync(request, enhancedPrompt, model, config.apiKey)
      }
    } catch (error) {
      console.error('通义万相生成失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误，请检查网络连接'
      }
    }
  }

  // ============================================
  // wan2.7 同步接口
  // ============================================

  /** 使用 wan2.7 同步接口生成图片 */
  private async generateSync(
    request: GenerateRequest,
    prompt: string,
    model: string,
    apiKey: string
  ): Promise<GenerateResponse> {
    const size = this.convertSizeForWan27(request.resolution)

    const body: Wan27SyncRequest = {
      model,
      input: {
        messages: [
          {
            role: 'user',
            content: [{ text: prompt }]
          }
        ]
      },
      parameters: {
        size,
        n: 1,
        watermark: false
      }
    }

    console.log('[wan2.7] 同步调用, model:', model, 'size:', size)

    const response = await fetch(this.syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[wan2.7] API 错误:', errorText)
      throw new Error(`API 请求失败 (${response.status}): ${errorText}`)
    }

    const result: Wan27SyncResponse = await response.json()

    if (result.code || result.message) {
      throw new Error(`${result.code || 'Error'}: ${result.message}`)
    }

    // 解析响应，提取图片 URL
    const choices = result.output?.choices
    if (choices && choices.length > 0) {
      const content = choices[0].message.content
      const imageItem = content.find(c => c.type === 'image')
      if (imageItem?.image) {
        return {
          success: true,
          wallpaper: {
            id: result.request_id,
            source: 'ai',
            prompt,
            imageUrl: imageItem.image,
            thumbnailUrl: imageItem.image,
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
            tokens: result.usage?.total_tokens || 1,
            cost: 0.08 // wan2.7 约 0.08 元/张
          }
        }
      }
    }

    throw new Error('生成失败：未返回图片')
  }

  // ============================================
  // wanx-v1 异步接口（旧版兼容）
  // ============================================

  /** 使用 wanx-v1 异步接口生成图片 */
  private async generateAsync(
    request: GenerateRequest,
    prompt: string,
    model: string,
    apiKey: string
  ): Promise<GenerateResponse> {
    const size = this.convertResolutionForWanxV1(request.resolution)

    const body: WanxV1Request = {
      model,
      input: {
        prompt,
        negative_prompt: request.negativePrompt || 'blurry, low quality, distorted, ugly, bad anatomy'
      },
      parameters: {
        size,
        n: 1,
        style: '<auto>'
      }
    }

    console.log('[wanx-v1] 异步调用, model:', model, 'size:', size)

    const response = await fetch(this.asyncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API 请求失败 (${response.status}): ${errorText}`)
    }

    const result: WanxV1Response = await response.json()

    if (result.code || result.message) {
      throw new Error(`${result.code || 'Error'}: ${result.message}`)
    }

    // 如果直接返回了结果
    if (result.output.task_status === 'SUCCEEDED' && result.output.results?.[0]) {
      return {
        success: true,
        wallpaper: {
          id: result.request_id,
          source: 'ai',
          prompt,
          imageUrl: result.output.results[0].url,
          thumbnailUrl: result.output.results[0].url,
          resolution: request.resolution,
          style: 'pixel',
          scene: request.scene,
          pixelConfig: request.pixelConfig,
          colorMode: request.colorMode,
          composition: request.composition,
          createdAt: new Date().toISOString(),
          isFavorite: false
        },
        usage: { tokens: result.usage?.image_count || 1, cost: 0.15 }
      }
    }

    // 需要轮询等待结果
    if (result.output.task_status === 'PENDING' || result.output.task_status === 'RUNNING') {
      return await this.pollTaskResult(result.output.task_id, apiKey, prompt, request)
    }

    throw new Error(result.message || '生成失败，请重试')
  }

  /** 轮询异步任务结果 */
  private async pollTaskResult(
    taskId: string,
    apiKey: string,
    prompt: string,
    request: GenerateRequest,
    maxAttempts: number = 60
  ): Promise<GenerateResponse> {
    for (let i = 0; i < maxAttempts; i++) {
      await this.sleep(2000)

      try {
        const response = await fetch(`${this.taskUrl}${taskId}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${apiKey}` }
        })

        if (!response.ok) continue

        const result: WanxV1TaskResponse = await response.json()

        if (result.output.task_status === 'SUCCEEDED' && result.output.results?.[0]) {
          return {
            success: true,
            wallpaper: {
              id: result.request_id,
              source: 'ai',
              prompt,
              imageUrl: result.output.results[0].url,
              thumbnailUrl: result.output.results[0].url,
              resolution: request.resolution,
              style: 'pixel',
              scene: request.scene,
              pixelConfig: request.pixelConfig,
              colorMode: request.colorMode,
              composition: request.composition,
              createdAt: new Date().toISOString(),
              isFavorite: false
            },
            usage: { tokens: result.usage?.image_count || 1, cost: 0.15 }
          }
        }

        if (result.output.task_status === 'FAILED') {
          throw new Error(result.message || '生成任务失败')
        }
      } catch (error) {
        if (error instanceof Error && error.message !== '生成任务失败') {
          console.error('轮询任务状态失败:', error)
        } else {
          throw error
        }
      }
    }

    return { success: false, error: '生成超时（2分钟），请重试' }
  }

  // ============================================
  // 分辨率转换
  // ============================================

  /**
   * wan2.7 支持的 size 参数值：
   * "1024*1024", "768*1344", "864*1152", "1152*864", "1344*768", "1440*720", "720*1440"
   * wan2.7-image-pro 文生图还支持 4K: "2560*1440"
   */
  private convertSizeForWan27(resolution: string): string {
    const { width, height } = this.parseResolution(resolution)
    const ratio = width / height

    // 4K 横屏
    if (width >= 2560 && height >= 1440) return '2560*1440'
    // 4K 竖屏
    if (height >= 2560 && width >= 1440) return '1440*2560'

    // 正方形
    if (ratio > 0.9 && ratio < 1.1) return '1024*1024'

    // 横屏
    if (ratio > 1) {
      if (ratio > 2) return '1440*720'      // 超宽屏
      if (ratio > 1.5) return '1344*768'    // 16:10
      return '1152*864'                      // 4:3 ~ 16:9
    }

    // 竖屏
    if (ratio < 0.5) return '720*1440'       // 超高
    if (ratio < 0.67) return '768*1344'      // 9:16
    return '864*1152'                         // 3:4
  }

  /**
   * wanx-v1 支持的尺寸（旧版）
   * 512*512, 720*720, 1024*1024, 1024*720, 720*1024, 1024*1792, 1792*1024
   */
  private convertResolutionForWanxV1(resolution: string): string {
    const { width, height } = this.parseResolution(resolution)

    if (width === height) {
      if (width <= 512) return '512*512'
      if (width <= 720) return '720*720'
      return '1024*1024'
    }

    if (width > height) {
      if (width >= 1792) return '1792*1024'
      return '1024*720'
    }

    if (height >= 1792) return '1024*1792'
    return '720*1024'
  }

  // ============================================
  // 工具方法
  // ============================================

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  validateConfig(config: ProviderConfig): boolean {
    return !!(
      config.apiKey &&
      config.apiKey.length > 10 &&
      config.enabled
    )
  }
}

// 导出单例
export const tongyiService = new TongyiService()
