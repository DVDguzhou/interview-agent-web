import { create } from 'zustand'
import type { ChatMessage, ServerMessage } from '../types/message'

interface ChatState {
  messages: ChatMessage[]
  connected: boolean
  isInterviewing: boolean
  currentStage: string
  conversationId: string

  addMessage: (msg: ChatMessage) => void
  updateMessage: (id: string, patch: Partial<ChatMessage> | ((m: ChatMessage) => Partial<ChatMessage>)) => void
  setConnected: (v: boolean) => void
  setInterviewing: (v: boolean) => void
  handleServerMessage: (msg: ServerMessage) => void
  clearMessages: () => void
}

let msgId = 0
export const nextId = () => `m${++msgId}`
const newConversationId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `c${Date.now()}`

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  connected: false,
  isInterviewing: false,
  currentStage: '',
  conversationId: newConversationId(),

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  updateMessage: (id, patch) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...(typeof patch === 'function' ? patch(m) : patch) } : m)),
    })),

  setConnected: (connected) => set({ connected }),

  setInterviewing: (v) => set({ isInterviewing: v }),

  // 新建对话：清空消息并切换会话 ID（后端按会话隔离短期记忆）
  clearMessages: () => set({ messages: [], conversationId: newConversationId() }),

  handleServerMessage: (msg) => {
    const now = Date.now()
    switch (msg.type) {
      case 'chat_reply':
        get().addMessage({
          id: nextId(), role: 'assistant', content: msg.content,
          messageType: 'text', timestamp: now,
        })
        break

      case 'stage_change':
        set({ currentStage: msg.stage })
        get().addMessage({
          id: nextId(), role: 'system', content: msg.message,
          messageType: 'stage', stage: msg.stage, timestamp: now,
        })
        break

      case 'question':
        get().addMessage({
          id: nextId(), role: 'assistant', content: msg.content,
          messageType: 'question', questionNum: msg.question_num, timestamp: now,
        })
        break

      case 'score':
        get().addMessage({
          id: nextId(), role: 'system', content: msg.feedback,
          messageType: 'score', score: msg.score, feedback: msg.feedback,
          keyPointsHit: msg.key_points_hit, keyPointsMissed: msg.key_points_missed,
          timestamp: now,
        })
        break

      case 'report':
        get().addMessage({
          id: nextId(), role: 'assistant', content: msg.content,
          messageType: 'report', timestamp: now,
        })
        break

      case 'review_plan':
        get().addMessage({
          id: nextId(), role: 'assistant', content: msg.content,
          messageType: 'review_plan', timestamp: now,
        })
        break

      case 'interview_complete':
        set({ isInterviewing: false, currentStage: '' })
        break

      case 'upload_result':
        get().addMessage({
          id: nextId(), role: 'system', content: msg.content,
          messageType: 'upload_result', timestamp: now,
          feedback: msg.message, // 校验失败详情
        })
        break

      case 'rag_evaluation':
        get().addMessage({
          id: nextId(), role: 'system', content: msg.rag_evaluation.summary,
          messageType: 'rag_evaluation', timestamp: now,
          ragEvaluation: msg.rag_evaluation,
        })
        break

      case 'error':
        get().addMessage({
          id: nextId(), role: 'system', content: msg.message,
          messageType: 'text', timestamp: now,
        })
        if (get().isInterviewing) {
          set({ isInterviewing: false, currentStage: '' })
        }
        break
    }
  },
}))
