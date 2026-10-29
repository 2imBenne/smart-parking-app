import React, { useState, useRef, useEffect } from 'react'
import { Button, Input, Card, Spin, Tag, Badge, Tooltip } from 'antd'
import { Send, X, Bot, MapPin, Sparkles, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { chatWithAi, type SuggestedParkingLot } from '../api/aiApi'

interface Message {
  id: string
  sender: 'user' | 'bot'
  text: string
  source?: string
  suggestedLots?: SuggestedParkingLot[]
  timestamp: string
}

export const AiChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Xin chào! Tôi là SmartParking AI Copilot. Tôi có thể hỗ trợ bạn tìm bãi xe thời gian thực hoặc giải đáp các thắc mắc về chính sách đỗ xe, giữ chỗ 10 phút và hoàn tiền.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])

  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  const quickPrompts = [
    'Tìm bãi xe ô tô còn chỗ gần tôi',
    'Quy định giữ chỗ 10 phút thế nào?',
    'Đỗ quá giờ thì bị tính phí ra sao?',
  ]

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim()
    if (!query || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Tự động lấy tọa độ nếu trình duyệt hỗ trợ
      let userLat: number | undefined
      let userLon: number | undefined

      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
          })
          userLat = pos.coords.latitude
          userLon = pos.coords.longitude
        } catch {
          // Bỏ qua nếu người dùng không cho quyền định vị
        }
      }

      const res = await chatWithAi({
        message: query,
        userLat,
        userLon,
      })

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.reply,
        source: res.source,
        suggestedLots: res.suggestedLots,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, botMessage])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'Rất tiếc, đã có lỗi kết nối đến trợ lý AI. Vui lòng kiểm tra lại dịch vụ hoặc thử lại sau.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen ? (
        <Tooltip title="Trợ lý AI Tìm Bãi Đỗ Xe & Hỏi Đáp" placement="left">
          <button
            type="button"
            className="group relative flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-teal-800 to-teal-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none ring-4 ring-teal-500/20"
            onClick={() => setIsOpen(true)}
          >
            <Bot size={28} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
            </span>
          </button>
        </Tooltip>
      ) : (
        <Card
          className="w-[380px] sm:w-[420px] h-[580px] shadow-2xl rounded-2xl border border-gray-200/80 overflow-hidden flex flex-col bg-white"
          styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%', padding: '0px' } }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-800 via-teal-700 to-teal-800 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <Bot size={20} className="text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-sm">
                  <span>SmartParking AI Copilot</span>
                  <Badge status="processing" color="#34d399" />
                </div>
                <div className="text-[11px] text-teal-100 flex items-center gap-1">
                  <Sparkles size={11} /> Realtime Grounding & Tool Calling
                </div>
              </div>
            </div>
            <button
              type="button"
              className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-slate-50 border-b border-gray-100 flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className="whitespace-nowrap px-2.5 py-1 bg-white hover:bg-teal-50 hover:text-teal-700 text-gray-600 rounded-full border border-gray-200 transition-colors flex-shrink-0"
                onClick={() => handleSend(p)}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed max-w-[85%] shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-teal-700 text-white rounded-br-xs'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-line">{m.text}</div>

                  {/* Render Suggested Parking Lots if any */}
                  {m.suggestedLots && m.suggestedLots.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-gray-100 space-y-2">
                      {m.suggestedLots.map((lot) => (
                        <div
                          key={lot.lotId}
                          className="p-2.5 rounded-xl bg-slate-50 border border-gray-200 hover:border-teal-400 transition-all text-left"
                        >
                          <div className="font-medium text-gray-900 text-xs flex items-center justify-between">
                            <span className="truncate max-w-[200px]">{lot.lotName}</span>
                            <Tag color="green" className="text-[10px] m-0">
                              Còn {lot.availableSlots} chỗ
                            </Tag>
                          </div>
                          <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                            <MapPin size={11} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{lot.address}</span>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100 text-[11px]">
                            <span className="font-semibold text-teal-700">
                              {lot.pricePerHour?.toLocaleString()} đ/giờ
                            </span>
                            <Button
                              type="primary"
                              size="small"
                              className="bg-teal-700 hover:bg-teal-800 text-[11px] h-6 px-2.5 rounded-md"
                              onClick={() => {
                                setIsOpen(false)
                                navigate(`/dashboard/parking/${lot.lotId}`)
                              }}
                            >
                              Giữ chỗ ngay
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tag source */}
                  {m.source === 'POLICY_FAQ' && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-teal-600 font-medium">
                      <ShieldCheck size={11} /> Quy chế chính thức SmartParkingHub
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-3 bg-white rounded-2xl max-w-[70%] border border-gray-100 shadow-sm text-xs text-gray-500">
                <Spin size="small" />
                <span>AI đang tìm kiếm dữ liệu bãi xe...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
            <Input
              value={input}
              placeholder="Hỏi về bãi xe, slot trống, phí quá giờ..."
              className="rounded-xl py-1.5 text-xs"
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={() => handleSend()}
              disabled={loading}
            />
            <Button
              type="primary"
              className="bg-teal-700 hover:bg-teal-800 rounded-xl flex items-center justify-center px-3"
              icon={<Send size={15} />}
              onClick={() => handleSend()}
              loading={loading}
            />
          </div>
        </Card>
      )}
    </div>
  )
}
