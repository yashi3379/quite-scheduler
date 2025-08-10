# チケット #004: 共通UIコンポーネント作成

## 概要
Button、Card、Input等の再利用可能コンポーネント（Tailwind CSS）

## 優先度
🟡 中優先度

## 詳細説明
quite-scheduler-boltのUIデザインを参考に、Tailwind CSSベースの再利用可能なUIコンポーネントライブラリを作成する。

## 実装内容

### 1. ユーティリティ関数
```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 2. Buttonコンポーネント
```typescript
// components/ui/Button.tsx
import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  ...props
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500"
  }
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  }

  return (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
      )}
      {children}
    </button>
  )
})

Button.displayName = 'Button'
export { Button }
```

### 3. Cardコンポーネント
```typescript
// components/ui/Card.tsx
import { forwardRef, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({
  className,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn("bg-white rounded-xl shadow-lg border border-gray-200", className)}
    {...props}
  />
))

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({
  className,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn("px-6 py-4 border-b border-gray-200", className)}
    {...props}
  />
))

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({
  className,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn("p-6", className)}
    {...props}
  />
))

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(({
  className,
  ...props
}, ref) => (
  <h2
    ref={ref}
    className={cn("text-xl font-bold text-gray-800", className)}
    {...props}
  />
))

export { Card, CardHeader, CardContent, CardTitle }
```

### 4. Inputコンポーネント
```typescript
// components/ui/Input.tsx
import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  className,
  error,
  label,
  ...props
}, ref) => (
  <div>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
    )}
    <input
      ref={ref}
      className={cn(
        "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors",
        error ? "border-red-500" : "border-gray-300",
        className
      )}
      {...props}
    />
    {error && (
      <p className="mt-1 text-sm text-red-600">{error}</p>
    )}
  </div>
))

Input.displayName = 'Input'
export { Input }
```

### 5. Textareaコンポーネント
```typescript
// components/ui/Textarea.tsx
import { forwardRef, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  label?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  className,
  error,
  label,
  ...props
}, ref) => (
  <div>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
    )}
    <textarea
      ref={ref}
      className={cn(
        "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-vertical",
        error ? "border-red-500" : "border-gray-300",
        className
      )}
      {...props}
    />
    {error && (
      <p className="mt-1 text-sm text-red-600">{error}</p>
    )}
  </div>
))

Textarea.displayName = 'Textarea'
export { Textarea }
```

### 6. Badgeコンポーネント
```typescript
// components/ui/Badge.tsx
import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800"
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
```

### 7. Spinnerコンポーネント
```typescript
// components/ui/Spinner.tsx
import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
        sizes[size],
        className
      )}
    />
  )
}
```

### 8. Modalコンポーネント
```typescript
// components/ui/Modal.tsx
'use client'
import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Modal({ isOpen, onClose, children, className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div className={cn("relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4", className)}>
        {children}
      </div>
    </div>,
    document.body
  )
}
```

## 完了条件
- [x] Button コンポーネントが実装済み（全バリアント）
- [x] Card コンポーネントセットが実装済み
- [x] Input・Textarea コンポーネントが実装済み
- [x] Badge コンポーネントが実装済み
- [x] Spinner コンポーネントが実装済み
- [x] Modal コンポーネントが実装済み
- [x] 全コンポーネントがアクセシビリティ対応済み
- [x] ユーティリティ関数（cn）が実装済み

## 関連ファイル
- `components/ui/*.tsx`
- `lib/utils.ts`

## 見積もり時間
3-4時間

## 注意事項
- quite-scheduler-boltのUIデザインを参考にする
- Tailwind CSSのデザイントークンに準拠
- アクセシビリティ（A11y）要件を満たす
- レスポンシブデザインに対応
- TypeScriptで適切に型付けする