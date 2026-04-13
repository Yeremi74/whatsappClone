import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { io } from 'socket.io-client'
import { listConversations } from '../../actions/conversationActions'
import styles from './SidebarConversations.module.css'

const SidebarConversations = ({ activeUserId }) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    try {
      const result = await listConversations()
      if (result.success) {
        setItems(result.data)
      } else if (!silent) {
        setError(result.error || t('chats.loadError'))
      }
    } catch {
      if (!silent) {
        setError(t('chats.networkError'))
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [t])

  useEffect(() => {
    load(false)
  }, [load])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return undefined
    const socket = io({
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling']
    })
    socket.on('inbox:update', () => {
      load(true)
    })
    return () => {
      socket.disconnect()
    }
  }, [load])

  if (loading) {
    return <p className={styles.hint}>{t('chats.loading')}</p>
  }

  if (error) {
    return <div className={styles.error}>{error}</div>
  }

  if (items.length === 0) {
    return <p className={styles.empty}>{t('chats.empty')}</p>
  }

  return (
    <ul className={styles.list}>
      {items.map((row) => {
        const other = row.otherUser
        const name = other?.name || '—'
        const initial = name.trim().charAt(0).toUpperCase() || '?'
        const oid = other?._id != null ? String(other._id) : ''
        const rawUnread = Number(row.unreadCount) || 0
        const isViewingThisChat =
          Boolean(activeUserId && oid && String(activeUserId) === String(oid))
        const unreadCount = isViewingThisChat ? 0 : rawUnread
        const hasUnread = unreadCount > 0
        let previewText = ''
        let previewMuted = false
        if (row.lastMessage?.content) {
          const raw = String(row.lastMessage.content).slice(0, 80)
          previewText = row.lastMessageFromMe
            ? `${t('chats.previewYou')}: ${raw}`
            : raw
        } else {
          previewMuted = true
          previewText = t('chats.noMessagesYet')
        }
        const isActive = oid && activeUserId && String(activeUserId) === oid
        const rowClass = [
          styles.row,
          isActive ? styles.rowActive : '',
          hasUnread ? styles.rowUnread : ''
        ]
          .filter(Boolean)
          .join(' ')
        const previewClass = hasUnread ? styles.rowPreviewUnread : previewMuted ? styles.rowPreviewMuted : styles.rowPreview
        const nameClass = hasUnread ? `${styles.rowName} ${styles.rowNameUnread}` : styles.rowName
        return (
          <li key={String(row.conversationId)}>
            <button
              type="button"
              className={rowClass}
              onClick={() => oid && navigate(`/chat/${oid}`)}
            >
              {other?.profilePicture ? (
                <img
                  className={styles.avatar}
                  src={other.profilePicture}
                  alt=""
                />
              ) : (
                <span className={styles.avatarPlaceholder}>{initial}</span>
              )}
              <span className={styles.rowBody}>
                <span className={styles.rowTop}>
                  <span className={nameClass}>{name}</span>
                  {hasUnread && (
                    <span className={styles.unreadBadge} aria-label={t('chats.unreadCount', { count: unreadCount })}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
                <span className={previewClass}>{previewText}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default SidebarConversations
