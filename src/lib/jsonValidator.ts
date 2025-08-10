import { ImportedJSON, ValidationError, ImportResult, FormattedContent } from '@/types/import'

export function validateImportedJSON(jsonString: string): ImportResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  
  try {
    const data = JSON.parse(jsonString) as ImportedJSON
    
    // 必須フィールドの検証
    if (!data.version) {
      errors.push({
        field: 'version',
        message: 'Version field is required',
        severity: 'error'
      })
    }
    
    if (!data.content_id) {
      errors.push({
        field: 'content_id',
        message: 'Content ID is required',
        severity: 'error'
      })
    }
    
    if (!data.created_at) {
      errors.push({
        field: 'created_at',
        message: 'Created at timestamp is required',
        severity: 'error'
      })
    } else {
      // 日付の有効性チェック
      const createdDate = new Date(data.created_at)
      if (isNaN(createdDate.getTime())) {
        errors.push({
          field: 'created_at',
          message: 'Invalid date format',
          severity: 'error'
        })
      }
    }
    
    // メタデータの検証
    if (!data.metadata) {
      errors.push({
        field: 'metadata',
        message: 'Metadata is required',
        severity: 'error'
      })
    } else {
      if (!data.metadata.title) {
        errors.push({
          field: 'metadata.title',
          message: 'Title is required',
          severity: 'error'
        })
      }
      
      if (!data.metadata.category) {
        warnings.push({
          field: 'metadata.category',
          message: 'Category is recommended',
          severity: 'warning'
        })
      }
      
      if (!data.metadata.tags || data.metadata.tags.length === 0) {
        warnings.push({
          field: 'metadata.tags',
          message: 'Tags are recommended for better organization',
          severity: 'warning'
        })
      }
    }
    
    // 言語データの検証
    if (!data.languages || Object.keys(data.languages).length === 0) {
      errors.push({
        field: 'languages',
        message: 'At least one language is required',
        severity: 'error'
      })
    } else {
      // 言語ごとの検証
      Object.entries(data.languages).forEach(([lang, langData]) => {
        if (!langData) {
          errors.push({
            field: `languages.${lang}`,
            message: `Language data for ${lang} is null or undefined`,
            severity: 'error'
          })
          return
        }
        
        if (!langData.platforms || langData.platforms.length === 0) {
          warnings.push({
            field: `languages.${lang}.platforms`,
            message: `No platforms found for ${lang}`,
            severity: 'warning'
          })
          return
        }
        
        langData.platforms.forEach((platform, index) => {
          if (!platform.platform) {
            errors.push({
              field: `languages.${lang}.platforms[${index}].platform`,
              message: 'Platform name is required',
              severity: 'error'
            })
          }
          
          if (!platform.content) {
            errors.push({
              field: `languages.${lang}.platforms[${index}].content`,
              message: 'Platform content is required',
              severity: 'error'
            })
          } else {
            // プラットフォーム別の文字数制限チェック
            const contentLength = platform.content.length
            
            switch (platform.platform.toLowerCase()) {
              case 'twitter':
                if (contentLength > 280) {
                  warnings.push({
                    field: `languages.${lang}.platforms[${index}].content`,
                    message: `Twitter content exceeds 280 characters (${contentLength} chars)`,
                    severity: 'warning'
                  })
                }
                break
                
              case 'threads':
                if (contentLength > 500) {
                  warnings.push({
                    field: `languages.${lang}.platforms[${index}].content`,
                    message: `Threads content exceeds 500 characters (${contentLength} chars)`,
                    severity: 'warning'
                  })
                }
                break
                
              case 'reddit':
                if (contentLength > 10000) {
                  warnings.push({
                    field: `languages.${lang}.platforms[${index}].content`,
                    message: `Reddit content is very long (${contentLength} chars)`,
                    severity: 'warning'
                  })
                }
                break
            }
          }
          
          // メタデータの検証
          if (!platform.metadata) {
            warnings.push({
              field: `languages.${lang}.platforms[${index}].metadata`,
              message: 'Platform metadata is missing',
              severity: 'warning'
            })
          } else {
            if (typeof platform.metadata.tokens !== 'number' || platform.metadata.tokens < 0) {
              warnings.push({
                field: `languages.${lang}.platforms[${index}].metadata.tokens`,
                message: 'Invalid token count',
                severity: 'warning'
              })
            }
            
            if (typeof platform.metadata.cost !== 'number' || platform.metadata.cost < 0) {
              warnings.push({
                field: `languages.${lang}.platforms[${index}].metadata.cost`,
                message: 'Invalid cost value',
                severity: 'warning'
              })
            }
          }
        })
      })
    }
    
    // エクスポート設定の検証
    if (data.export_settings) {
      if (data.export_settings.expiry_date) {
        const expiryDate = new Date(data.export_settings.expiry_date)
        if (isNaN(expiryDate.getTime())) {
          warnings.push({
            field: 'export_settings.expiry_date',
            message: 'Invalid expiry date format',
            severity: 'warning'
          })
        } else if (expiryDate < new Date()) {
          warnings.push({
            field: 'export_settings.expiry_date',
            message: 'Content has expired',
            severity: 'warning'
          })
        }
      }
      
      // 互換性の検証
      if (data.export_settings.compatible_apps && 
          Array.isArray(data.export_settings.compatible_apps) &&
          !data.export_settings.compatible_apps.includes('quite-scheduler')) {
        warnings.push({
          field: 'export_settings.compatible_apps',
          message: 'Content may not be fully compatible with quite-scheduler',
          severity: 'warning'
        })
      }
    }
    
    return {
      success: errors.length === 0,
      data: errors.length === 0 ? data : undefined,
      errors,
      warnings
    }
    
  } catch (parseError) {
    return {
      success: false,
      errors: [{
        field: 'json',
        message: `Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        severity: 'error'
      }],
      warnings: []
    }
  }
}

export function formatContentForScheduling(importedData: ImportedJSON): FormattedContent {
  const availableLanguages = Object.keys(importedData.languages)
  const availablePlatforms = Object.values(importedData.languages)
    .filter(Boolean)
    .flatMap(lang => lang.platforms.map(p => p.platform))
    .filter((platform, index, arr) => arr.indexOf(platform) === index)
  
  return {
    content_id: importedData.content_id,
    imported_content: importedData,
    available_languages: availableLanguages,
    available_platforms: availablePlatforms,
    metadata: importedData.metadata,
    created_at: importedData.created_at
  }
}

export function getContentStats(importedData: ImportedJSON) {
  let totalPlatforms = 0
  let totalCharacters = 0
  let totalTokens = 0
  let totalCost = 0
  
  Object.values(importedData.languages).forEach(langData => {
    if (langData?.platforms) {
      langData.platforms.forEach(platform => {
        totalPlatforms++
        totalCharacters += platform.content.length
        totalTokens += platform.metadata?.tokens || 0
        totalCost += platform.metadata?.cost || 0
      })
    }
  })
  
  return {
    totalPlatforms,
    totalCharacters,
    totalTokens,
    totalCost: Math.round(totalCost * 10000) / 10000, // 小数点4桁まで
    languages: Object.keys(importedData.languages).length
  }
}