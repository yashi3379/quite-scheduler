interface CopyStatusIndicatorProps {
  status?: string
}

export default function CopyStatusIndicator({ status }: CopyStatusIndicatorProps) {
  if (!status) return null

  const statusConfig = {
    copied: {
      icon: '✓',
      color: 'text-green-600',
      bg: 'bg-green-100',
      label: 'Copied'
    },
    pending: {
      icon: '⏳',
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
      label: 'Pending'
    },
    failed: {
      icon: '❌',
      color: 'text-red-600',
      bg: 'bg-red-100',
      label: 'Failed'
    }
  }

  const config = statusConfig[status as keyof typeof statusConfig]
  if (!config) return null

  return (
    <span 
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
      title={config.label}
    >
      {config.icon}
    </span>
  )
}