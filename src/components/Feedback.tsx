import { MessageBar, MessageBarBody } from '@fluentui/react-components'

export function Feedback({ error }: { error: string }) {
  return error ? (
    <MessageBar intent="error" className="feedback">
      <MessageBarBody>{error}</MessageBarBody>
    </MessageBar>
  ) : null
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><div className="empty-icon">⌕</div><strong>{title}</strong><span>{detail}</span></div>
}
