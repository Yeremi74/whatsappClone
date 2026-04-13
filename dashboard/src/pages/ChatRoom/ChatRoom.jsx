import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { io } from 'socket.io-client'
import {
  openConversationWithUser,
  getConversationMessages,
  markConversationRead
} from '../../actions/conversationActions'
import { getCurrentUser } from '../../actions/userActions'
import {
  IoArchiveOutline,
  IoAttachOutline,
  IoClose,
  IoDocumentAttachOutline,
  IoDocumentOutline,
  IoDocumentTextOutline,
  IoArrowDownOutline,
  IoFilmOutline,
  IoHappyOutline,
  IoImageOutline,
  IoMicOutline,
  IoReaderOutline,
  IoSend,
  IoStatsChartOutline
} from 'react-icons/io5'
import styles from './ChatRoom.module.css'

const EMOJI_GRID = [
  '😀',
  '😃',
  '😄',
  '😁',
  '😅',
  '😂',
  '🤣',
  '😊',
  '😇',
  '🙂',
  '😉',
  '😍',
  '🥰',
  '😘',
  '😋',
  '😛',
  '😜',
  '🤪',
  '😎',
  '🥳',
  '😏',
  '😢',
  '😭',
  '😤',
  '😡',
  '🤔',
  '😴',
  '👍',
  '👎',
  '👏',
  '🙌',
  '🤝',
  '🙏',
  '❤️',
  '🔥',
  '✨',
  '✅',
  '❌',
  '💬',
  '💯'
]

const MAX_FILE_BYTES = 4 * 1024 * 1024

const MEDIA_BUBBLE_PADDING_X = 8

const BUBBLE_MINE_DEFAULT_PAD_X = 12

const plainMessageText = (c) =>
  typeof c === 'string' ? c.replace(/\u200b/g, '').trim() : ''

const isImageAttachment = (a) => {
  if (typeof a !== 'string' || !a) return false
  if (a.startsWith('data:image')) return true
  if (a.startsWith('blob:')) return true
  const lower = a.toLowerCase()
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return /\.(jpe?g|png|gif|webp|bmp|svg)(\?|#|$)/i.test(a)
  }
  return false
}

const messageHasImageAttachment = (m) => {
  const attachments = Array.isArray(m.attachments) ? m.attachments : []
  return attachments.some(
    (a) => typeof a === 'string' && isImageAttachment(a)
  )
}

const parseDocContent = (raw) => {
  const plain = plainMessageText(raw)
  const normalized = plain.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const firstNl = normalized.indexOf('\n')
  const firstLine = (
    firstNl === -1 ? normalized : normalized.slice(0, firstNl)
  ).trim()
  const rest =
    firstNl === -1 ? '' : normalized.slice(firstNl + 1).replace(/^\n+/, '')
  const m = /^📎 (.+)$/.exec(firstLine)
  if (!m) return { docName: null, caption: normalized }
  return { docName: m[1].trim(), caption: rest }
}

const dataUrlMeta = (dataUrl) => {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return { mime: 'application/octet-stream', size: 0 }
  }
  const semi = dataUrl.indexOf(';')
  const comma = dataUrl.indexOf(',')
  if (semi === -1 || comma === -1) {
    return { mime: 'application/octet-stream', size: 0 }
  }
  const mime = dataUrl.slice(5, semi) || 'application/octet-stream'
  const b64 = dataUrl.slice(comma + 1)
  const pad = (b64.match(/=+$/) || [''])[0].length
  const size = Math.max(0, Math.floor((b64.length * 3) / 4) - pad)
  return { mime, size }
}

const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let n = bytes
  let u = 0
  while (n >= 1024 && u < units.length - 1) {
    n /= 1024
    u += 1
  }
  const digits = u === 0 ? 0 : n < 10 ? 1 : n < 100 ? 1 : 0
  return `${n.toFixed(digits)} ${units[u]}`
}

const fileDisplayInfo = (mime, fileName, t) => {
  const ext = (fileName || '').split('.').pop()?.toLowerCase() || ''
  const m = (mime || '').toLowerCase()
  if (m.includes('pdf') || ext === 'pdf') {
    return {
      Icon: IoDocumentOutline,
      typeLabel: t('chat.fileTypePdf'),
      iconClass: styles.docIconPdf
    }
  }
  if (
    m.includes('word') ||
    m.includes('msword') ||
    ext === 'doc' ||
    ext === 'docx'
  ) {
    return {
      Icon: IoDocumentTextOutline,
      typeLabel: t('chat.fileTypeWord'),
      iconClass: styles.docIconWord
    }
  }
  if (
    m.includes('sheet') ||
    m.includes('excel') ||
    ext === 'xls' ||
    ext === 'xlsx' ||
    ext === 'csv'
  ) {
    return {
      Icon: IoStatsChartOutline,
      typeLabel: t('chat.fileTypeExcel'),
      iconClass: styles.docIconExcel
    }
  }
  if (
    m.includes('presentation') ||
    m.includes('powerpoint') ||
    ext === 'ppt' ||
    ext === 'pptx'
  ) {
    return {
      Icon: IoReaderOutline,
      typeLabel: t('chat.fileTypePpt'),
      iconClass: styles.docIconPpt
    }
  }
  if (
    m.includes('zip') ||
    m.includes('rar') ||
    m.includes('compressed') ||
    ext === 'zip' ||
    ext === 'rar' ||
    ext === '7z'
  ) {
    return {
      Icon: IoArchiveOutline,
      typeLabel: t('chat.fileTypeZip'),
      iconClass: styles.docIconZip
    }
  }
  if (m.startsWith('audio/') || /^(mp3|wav|ogg|m4a|flac)$/.test(ext)) {
    return {
      Icon: IoMicOutline,
      typeLabel: t('chat.fileTypeAudio'),
      iconClass: styles.docIconAudio
    }
  }
  if (m.startsWith('video/') || /^(mp4|webm|mov|mkv|avi)$/.test(ext)) {
    return {
      Icon: IoFilmOutline,
      typeLabel: t('chat.fileTypeVideo'),
      iconClass: styles.docIconVideo
    }
  }
  if (m.startsWith('image/')) {
    return {
      Icon: IoImageOutline,
      typeLabel: t('chat.fileTypeImage'),
      iconClass: styles.docIconImage
    }
  }
  if (m.startsWith('text/') || ext === 'txt' || ext === 'md') {
    return {
      Icon: IoDocumentTextOutline,
      typeLabel: t('chat.fileTypeText'),
      iconClass: styles.docIconText
    }
  }
  return {
    Icon: IoDocumentAttachOutline,
    typeLabel: t('chat.fileTypeGeneric'),
    iconClass: styles.docIconGeneric
  }
}

const ChatRoom = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [me, setMe] = useState(null)
  const [peer, setPeer] = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [peerTyping, setPeerTyping] = useState(false)
  const [socketReady, setSocketReady] = useState(false)
  const [attachMenuOpen, setAttachMenuOpen] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [pendingAttachment, setPendingAttachment] = useState(null)
  const [composerError, setComposerError] = useState(null)
  const [mineMediaBubbleWidthPx, setMineMediaBubbleWidthPx] = useState({})
  const listRef = useRef(null)
  const typingClearRef = useRef(null)
  const typingEmitRef = useRef(null)
  const socketRef = useRef(null)
  const textareaRef = useRef(null)
  const imageInputRef = useRef(null)
  const documentInputRef = useRef(null)
  const attachWrapRef = useRef(null)
  const emojiWrapRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    const el = listRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [])

  const onMineMediaImageLoad = useCallback((messageId, imgEl, padX) => {
    if (!imgEl) return
    const px =
      typeof padX === 'number' && padX > 0 ? padX : MEDIA_BUBBLE_PADDING_X
    const measure = () => {
      const w = Math.round(imgEl.getBoundingClientRect().width)
      if (!w || w <= 0) return
      setMineMediaBubbleWidthPx((prev) => {
        const bubbleW = w + px * 2
        const next = Math.max(prev[messageId] || 0, bubbleW)
        if (prev[messageId] === next) return prev
        return { ...prev, [messageId]: next }
      })
    }
    requestAnimationFrame(() => {
      measure()
      requestAnimationFrame(measure)
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (!composerError) return
    const id = setTimeout(() => setComposerError(null), 4000)
    return () => clearTimeout(id)
  }, [composerError])

  useEffect(() => {
    setMineMediaBubbleWidthPx({})
  }, [conversationId])

  useEffect(() => {
    let cancelled = false
    const loadMe = async () => {
      const result = await getCurrentUser()
      if (!cancelled && result.success) {
        setMe(result.data)
      }
    }
    loadMe()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!userId) {
      setError(t('chat.invalidPeer'))
      setLoading(false)
      return
    }

    let cancelled = false

    const boot = async () => {
      setLoading(true)
      setError(null)
      setMessages([])
      setPeer(null)
      setConversationId(null)

      const opened = await openConversationWithUser(userId)
      if (cancelled) return

      if (!opened.success) {
        setError(opened.error || t('chat.openError'))
        setLoading(false)
        return
      }

      const cid = opened.data?.conversationId
      const p = opened.data?.peer
      if (!cid || !p) {
        setError(t('chat.openError'))
        setLoading(false)
        return
      }

      setConversationId(String(cid))
      setPeer(p)

      const msgs = await getConversationMessages(String(cid))
      if (cancelled) return

      if (!msgs.success) {
        setError(msgs.error || t('chat.loadMessagesError'))
        setLoading(false)
        return
      }

      setMessages(msgs.data || [])
      setLoading(false)
      void markConversationRead(String(cid))
    }

    boot()

    return () => {
      cancelled = true
    }
  }, [userId, t])

  useEffect(() => {
    const onDocKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (attachMenuOpen || emojiOpen) {
          e.preventDefault()
          setAttachMenuOpen(false)
          setEmojiOpen(false)
          return
        }
        e.preventDefault()
        navigate('/chats')
      }
    }
    window.addEventListener('keydown', onDocKeyDown)
    return () => window.removeEventListener('keydown', onDocKeyDown)
  }, [navigate, attachMenuOpen, emojiOpen])

  useEffect(() => {
    const onDown = (e) => {
      if (attachWrapRef.current && !attachWrapRef.current.contains(e.target)) {
        setAttachMenuOpen(false)
      }
      if (emojiWrapRef.current && !emojiWrapRef.current.contains(e.target)) {
        setEmojiOpen(false)
      }
    }
    if (attachMenuOpen || emojiOpen) {
      document.addEventListener('mousedown', onDown)
      return () => document.removeEventListener('mousedown', onDown)
    }
  }, [attachMenuOpen, emojiOpen])

  useEffect(() => {
    if (!conversationId) return

    const token = localStorage.getItem('token')
    if (!token) return

    const socket = io({
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling']
    })
    socketRef.current = socket

    const onConnect = () => {
      socket.emit('joinConversation', conversationId, () => {
        setSocketReady(true)
      })
    }

    socket.on('connect', onConnect)

    socket.on('message:new', (msg) => {
      if (!msg?._id) return
      setMessages((prev) => {
        if (prev.some((m) => String(m._id) === String(msg._id))) {
          return prev
        }
        return [...prev, msg]
      })
      const s = msg.senderId
      const sid =
        s && typeof s === 'object' && s._id != null
          ? String(s._id)
          : s != null
            ? String(s)
            : ''
      if (sid && userId && sid === String(userId)) {
        void markConversationRead(conversationId)
      }
    })

    socket.on('userTyping', ({ userId: uid, isTyping }) => {
      if (String(uid) !== String(userId)) return
      if (typingClearRef.current) {
        clearTimeout(typingClearRef.current)
        typingClearRef.current = null
      }
      setPeerTyping(Boolean(isTyping))
      if (isTyping) {
        typingClearRef.current = setTimeout(() => {
          setPeerTyping(false)
        }, 5000)
      }
    })

    if (socket.connected) {
      onConnect()
    }

    return () => {
      setSocketReady(false)
      socket.emit('leaveConversation', conversationId)
      socket.off('connect', onConnect)
      socket.off('message:new')
      socket.off('userTyping')
      socket.disconnect()
      socketRef.current = null
      if (typingClearRef.current) {
        clearTimeout(typingClearRef.current)
      }
    }
  }, [conversationId, userId])

  const insertAtCursor = (insert) => {
    const el = textareaRef.current
    const start = el ? el.selectionStart : draft.length
    const end = el ? el.selectionEnd : draft.length
    const next = draft.slice(0, start) + insert + draft.slice(end)
    setDraft(next)
    requestAnimationFrame(() => {
      if (!textareaRef.current) return
      textareaRef.current.focus()
      const pos = start + insert.length
      textareaRef.current.setSelectionRange(pos, pos)
    })
  }

  const onPickFile = async (file, kind) => {
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      setComposerError(t('chat.fileTooLarge'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : ''
      if (!dataUrl) return
      setPendingAttachment({
        name: file.name,
        dataUrl,
        kind
      })
    }
    reader.readAsDataURL(file)
  }

  const onImageInputChange = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (f) void onPickFile(f, 'image')
  }

  const onDocumentInputChange = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (f) void onPickFile(f, 'file')
  }

  const sendText = () => {
    const socket = socketRef.current
    if (!socket || !conversationId) return
    const trimmed = draft.trim()
    const urls = pendingAttachment ? [pendingAttachment.dataUrl] : []
    if (!trimmed && urls.length === 0) return

    let contentOut = trimmed
    if (pendingAttachment?.kind === 'file') {
      contentOut = `📎 ${pendingAttachment.name}`
      if (trimmed) {
        contentOut += `\n\n${trimmed}`
      }
    }

    socket.emit('sendMessage', {
      conversationId,
      content: contentOut,
      attachments: urls
    })
    setDraft('')
    setPendingAttachment(null)
    socket.emit('typing', { conversationId, isTyping: false })
    if (typingEmitRef.current) {
      clearTimeout(typingEmitRef.current)
      typingEmitRef.current = null
    }
  }

  const onDraftChange = (e) => {
    const value = e.target.value
    setDraft(value)
    const socket = socketRef.current
    if (!socket || !conversationId) return

    socket.emit('typing', { conversationId, isTyping: true })
    if (typingEmitRef.current) {
      clearTimeout(typingEmitRef.current)
    }
    typingEmitRef.current = setTimeout(() => {
      socket.emit('typing', { conversationId, isTyping: false })
      typingEmitRef.current = null
    }, 2000)
  }

  const onDraftBlur = () => {
    const socket = socketRef.current
    if (!socket || !conversationId) return
    if (typingEmitRef.current) {
      clearTimeout(typingEmitRef.current)
      typingEmitRef.current = null
    }
    socket.emit('typing', { conversationId, isTyping: false })
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendText()
    }
  }

  const peerName = peer?.name || '—'
  const peerInitial = peerName.trim().charAt(0).toUpperCase() || '?'

  const senderKey = (m) => {
    const s = m.senderId
    if (s && typeof s === 'object' && s._id != null) return String(s._id)
    if (s != null) return String(s)
    return ''
  }

  const canSend =
    socketReady && (Boolean(draft.trim()) || Boolean(pendingAttachment))

  const bubbleMediaOnlyClass = (m) => {
    const attachments = Array.isArray(m.attachments) ? m.attachments : []
    const imgs = attachments.filter(
      (a) => typeof a === 'string' && isImageAttachment(a)
    )
    const others = attachments.filter(
      (a) => typeof a === 'string' && !isImageAttachment(a)
    )
    const raw = typeof m.content === 'string' ? m.content : ''
    const plain = plainMessageText(raw)
    const { docName, caption } = parseDocContent(raw)
    const hasRichDoc =
      others.length > 0 && imgs.length === 0 && Boolean(docName)
    const bottomText = hasRichDoc ? caption : plain
    if (imgs.length > 0 && others.length === 0 && !bottomText) {
      return styles.bubbleMediaOnly
    }
    return ''
  }

  const renderBubbleContent = (m, opts) => {
    const onImageLoad = opts?.onImageLoad
    const attachments = Array.isArray(m.attachments) ? m.attachments : []
    const imgs = attachments.filter(
      (a) => typeof a === 'string' && isImageAttachment(a)
    )
    const others = attachments.filter(
      (a) => typeof a === 'string' && !isImageAttachment(a)
    )
    const raw = typeof m.content === 'string' ? m.content : ''
    const plain = plainMessageText(raw)
    const { docName, caption } = parseDocContent(raw)
    const hasRichDoc =
      others.length > 0 && imgs.length === 0 && Boolean(docName)

    if (imgs.length === 0 && others.length === 0) {
      return plain ? (
        <span className={styles.bubbleText}>{plain}</span>
      ) : null
    }

    const bottomText = hasRichDoc ? caption : plain

    return (
      <>
        {imgs.map((url, i) => (
          <img
            key={`img-${String(m._id)}-${i}`}
            className={styles.bubbleImg}
            src={url}
            alt=""
            onLoad={onImageLoad}
          />
        ))}
        {others.map((url, i) => {
          const fileLabel =
            i === 0 && docName ? docName : `file-${i + 1}`
          if (hasRichDoc) {
            const meta = dataUrlMeta(url)
            const info = fileDisplayInfo(meta.mime, fileLabel, t)
            const Icon = info.Icon
            return (
              <div
                key={`doc-${String(m._id)}-${i}`}
                className={styles.docCard}
              >
                <div className={styles.docIconWrap}>
                  <Icon className={info.iconClass} aria-hidden />
                </div>
                <div className={styles.docBody}>
                  <span className={styles.docName}>{fileLabel}</span>
                  <span className={styles.docMeta}>
                    {info.typeLabel} · {formatFileSize(meta.size)}
                  </span>
                </div>
                <a
                  className={styles.docDownload}
                  href={url}
                  download={fileLabel}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('chat.download')}
                  title={t('chat.download')}
                >
                  <IoArrowDownOutline className={styles.docDownloadIcon} aria-hidden />
                </a>
              </div>
            )
          }
          return (
            <a
              key={`a-${String(m._id)}-${i}`}
              className={styles.bubbleAttach}
              href={url}
              download={docName && i === 0 ? docName : `file-${i + 1}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {docName && i === 0 ? docName : t('chat.downloadFile')}
            </a>
          )
        })}
        {bottomText ? (
          <span className={styles.bubbleText}>{bottomText}</span>
        ) : null}
      </>
    )
  }

  return (
    <div className={styles.layout}>
      <header className={styles.topBar}>
        <div className={styles.peerBlock}>
          {peer?.profilePicture ? (
            <img
              className={styles.peerAvatar}
              src={peer.profilePicture}
              alt=""
            />
          ) : (
            <span className={styles.peerAvatarPh}>{peerInitial}</span>
          )}
          <div className={styles.peerText}>
            <span className={styles.peerName}>{peerName}</span>
            <span className={styles.peerStatus}>
              {peerTyping ? t('chat.typing') : '\u00a0'}
            </span>
          </div>
        </div>
      </header>

      {loading && (
        <div className={styles.centerHint}>{t('chat.loading')}</div>
      )}

      {!loading && error && (
        <div className={styles.centerError}>
          <p>{error}</p>
          <button
            type="button"
            className={styles.retry}
            onClick={() => navigate('/chats')}
          >
            {t('chat.back')}
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className={styles.messages} ref={listRef}>
            {messages.map((m) => {
              const mine =
                me &&
                senderKey(m) &&
                String(senderKey(m)) === String(me._id)
              const mediaOnly = bubbleMediaOnlyClass(m)
              const msgId = String(m._id)
              const mineHasImg = mine && messageHasImageAttachment(m)
              const mineImgPadX =
                mediaOnly === styles.bubbleMediaOnly
                  ? MEDIA_BUBBLE_PADDING_X
                  : BUBBLE_MINE_DEFAULT_PAD_X
              const measuredMineW = mineHasImg
                ? mineMediaBubbleWidthPx[msgId]
                : undefined
              return (
                <div
                  key={msgId}
                  className={`${mine ? styles.bubbleMine : styles.bubbleTheirs}${mediaOnly ? ` ${mediaOnly}` : ''}`}
                  style={
                    measuredMineW != null
                      ? {
                          maxWidth: measuredMineW,
                          width: 'fit-content'
                        }
                      : undefined
                  }
                >
                  {renderBubbleContent(
                    m,
                    mineHasImg
                      ? {
                          onImageLoad: (e) =>
                            onMineMediaImageLoad(
                              msgId,
                              e.currentTarget,
                              mineImgPadX
                            )
                        }
                      : undefined
                  )}
                </div>
              )
            })}
          </div>

          <footer className={styles.composer}>
            {composerError && (
              <div className={styles.composerError}>{composerError}</div>
            )}
            {pendingAttachment && (
              <div className={styles.pendingRow}>
                <div className={styles.pendingRowAccent} aria-hidden />
                <div className={styles.pendingRowMain}>
                  {pendingAttachment.kind === 'image' ? (
                    <>
                      <div className={styles.pendingImageWrap}>
                        <img
                          className={styles.pendingThumb}
                          src={pendingAttachment.dataUrl}
                          alt=""
                        />
                      </div>
                      <div className={styles.pendingMeta}>
                        <span className={styles.pendingTitle}>
                          {t('chat.fileTypeImage')}
                        </span>
                        <span className={styles.pendingSubtitle}>
                          {t('chat.pendingAttachmentHint')}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.pendingDocIconWrap}>
                        <IoDocumentAttachOutline
                          className={styles.pendingDocGlyph}
                          aria-hidden
                        />
                      </div>
                      <div className={styles.pendingMeta}>
                        <span className={styles.pendingDocName}>
                          {pendingAttachment.name}
                        </span>
                        <span className={styles.pendingSubtitle}>
                          {t('chat.attachDocument')}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.pendingRemove}
                  onClick={() => setPendingAttachment(null)}
                  aria-label={t('chat.removeAttachment')}
                >
                  <IoClose className={styles.pendingRemoveIcon} aria-hidden />
                </button>
              </div>
            )}
            <div className={styles.composerRow}>
              <div className={styles.attachWrap} ref={attachWrapRef}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => {
                    setAttachMenuOpen((v) => !v)
                    setEmojiOpen(false)
                  }}
                  aria-label={t('chat.attach')}
                  disabled={!socketReady}
                >
                  <IoAttachOutline className={styles.iconBtnGlyph} aria-hidden />
                </button>
                {attachMenuOpen && (
                  <div className={styles.attachMenu} role="menu">
                    <button
                      type="button"
                      role="menuitem"
                      className={styles.attachMenuItem}
                      onClick={() => {
                        imageInputRef.current?.click()
                        setAttachMenuOpen(false)
                      }}
                    >
                      <IoImageOutline className={styles.attachMenuGlyph} aria-hidden />
                      <span>{t('chat.attachPhotos')}</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className={styles.attachMenuItem}
                      onClick={() => {
                        documentInputRef.current?.click()
                        setAttachMenuOpen(false)
                      }}
                    >
                      <IoDocumentTextOutline className={styles.attachMenuGlyph} aria-hidden />
                      <span>{t('chat.attachDocument')}</span>
                    </button>
                  </div>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className={styles.hiddenInput}
                  onChange={onImageInputChange}
                />
                <input
                  ref={documentInputRef}
                  type="file"
                  className={styles.hiddenInput}
                  onChange={onDocumentInputChange}
                />
              </div>

              <div className={styles.emojiWrap} ref={emojiWrapRef}>
                <button
                  type="button"
                  className={`${styles.iconBtn} ${emojiOpen ? styles.iconBtnActive : ''}`}
                  onClick={() => {
                    setEmojiOpen((v) => !v)
                    setAttachMenuOpen(false)
                  }}
                  aria-label={t('chat.emoji')}
                  aria-expanded={emojiOpen}
                  aria-haspopup="listbox"
                  disabled={!socketReady}
                >
                  <IoHappyOutline className={styles.iconBtnGlyph} aria-hidden />
                </button>
                {emojiOpen && (
                  <div
                    className={styles.emojiPanel}
                    role="listbox"
                    aria-label={t('chat.emojiPickerTitle')}
                  >
                    <div className={styles.emojiPanelHeader}>{t('chat.emojiPickerTitle')}</div>
                    <div className={styles.emojiPanelScroll}>
                      {EMOJI_GRID.map((em) => (
                        <button
                          key={em}
                          type="button"
                          role="option"
                          className={styles.emojiCell}
                          onClick={() => {
                            insertAtCursor(em)
                          }}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <textarea
                ref={textareaRef}
                className={styles.input}
                rows={1}
                value={draft}
                onChange={onDraftChange}
                onBlur={onDraftBlur}
                onKeyDown={onKeyDown}
                placeholder={t('chat.placeholder')}
                disabled={!socketReady}
              />
              <button
                type="button"
                className={styles.send}
                onClick={sendText}
                disabled={!canSend}
                aria-label={t('chat.send')}
                title={t('chat.send')}
              >
                <IoSend className={styles.sendIcon} aria-hidden />
              </button>
            </div>
          </footer>
        </>
      )}
    </div>
  )
}

export default ChatRoom
