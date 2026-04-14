import React, { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDashboard } from '../../context/DashboardContext'
import { io } from 'socket.io-client'
import {
  listConversations,
  markConversationRead,
  deleteConversation
} from '../../actions/conversationActions'
import styles from './SidebarConversations.module.css'

const MENU_PAD = 8
const MENU_FRAME = 12
const MENU_ITEM_H = 40

const menuHeightForItems = (n) => MENU_FRAME + n * MENU_ITEM_H

const SidebarConversations = ({ activeUserId }) => {
  const { openChat, openUserProfile, clearMain } = useDashboard()
  const { t } = useTranslation()
  const [menu, setMenu] = useState(null)
  const [markingId, setMarkingId] = useState(null)
  const [deletingConvId, setDeletingConvId] = useState(null)
  const menuRef = useRef(null)
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

  const closeMenu = useCallback(() => {
    setMenu(null)
  }, [])

  useEffect(() => {
    if (!menu) return undefined
    const onPointer = (e) => {
      if (menuRef.current?.contains(e.target)) return
      closeMenu()
    }
    const onKey = (e) => {
      if (e.key === 'Escape') closeMenu()
    }
    const onScroll = () => closeMenu()
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [menu, closeMenu])

  const openMenu = (e, row) => {
    e.preventDefault()
    e.stopPropagation()
    const rawUnread = Number(row.unreadCount) || 0
    const itemCount = 2 + (rawUnread > 0 ? 1 : 0) + 1
    const h = menuHeightForItems(itemCount)
    let x = e.clientX
    let y = e.clientY
    if (x + 200 + MENU_PAD > window.innerWidth) {
      x = window.innerWidth - 200 - MENU_PAD
    }
    if (y + h + MENU_PAD > window.innerHeight) {
      y = window.innerHeight - h - MENU_PAD
    }
    x = Math.max(MENU_PAD, x)
    y = Math.max(MENU_PAD, y)
    setMenu({ x, y, row })
  }

  const handleMenuChat = () => {
    const other = menu?.row?.otherUser
    const oid = other?._id != null ? String(other._id) : ''
    closeMenu()
    if (oid) openChat(oid)
  }

  const handleMenuProfile = () => {
    const other = menu?.row?.otherUser
    const oid = other?._id != null ? String(other._id) : ''
    closeMenu()
    if (oid) openUserProfile(oid)
  }

  const handleMenuMarkRead = async () => {
    const cid = menu?.row?.conversationId
    if (cid == null) return
    const id = String(cid)
    setMarkingId(id)
    try {
      const result = await markConversationRead(id)
      if (result?.success) {
        closeMenu()
        load(true)
      }
    } finally {
      setMarkingId(null)
    }
  }

  const handleMenuDeleteConversation = async () => {
    const cid = menu?.row?.conversationId
    if (cid == null) return
    const id = String(cid)
    const other = menu?.row?.otherUser
    const oid = other?._id != null ? String(other._id) : ''
    setDeletingConvId(id)
    try {
      const result = await deleteConversation(id)
      if (result?.success) {
        closeMenu()
        await load(true)
        if (oid && activeUserId && String(activeUserId) === oid) {
          clearMain()
        }
      }
    } finally {
      setDeletingConvId(null)
    }
  }

  if (loading) {
    return <p className={styles.hint}>{t('chats.loading')}</p>
  }

  if (error) {
    return <div className={styles.error}>{error}</div>
  }

  if (items.length === 0) {
    return <p className={styles.empty}>{t('chats.empty')}</p>
  }

  const menuRow = menu?.row
  const menuRawUnread = menuRow ? Number(menuRow.unreadCount) || 0 : 0
  const menuConvId =
    menuRow?.conversationId != null ? String(menuRow.conversationId) : ''

  const menuEl =
    menu &&
    createPortal(
      <div
        ref={menuRef}
        className={styles.contextMenu}
        style={{ left: menu.x, top: menu.y }}
        role="menu"
      >
        <button type="button" className={styles.ctxItem} role="menuitem" onClick={handleMenuChat}>
          {t('navbar.contextMenuChat')}
        </button>
        {menuRawUnread > 0 ? (
          <button
            type="button"
            className={styles.ctxItem}
            role="menuitem"
            disabled={markingId === menuConvId}
            onClick={handleMenuMarkRead}
          >
            {markingId === menuConvId ? t('chats.contextMenuMarkingRead') : t('chats.contextMenuMarkRead')}
          </button>
        ) : null}
        <button type="button" className={styles.ctxItem} role="menuitem" onClick={handleMenuProfile}>
          {t('navbar.contextMenuViewProfile')}
        </button>
        <button
          type="button"
          className={`${styles.ctxItem} ${styles.ctxItemDanger}`}
          role="menuitem"
          disabled={deletingConvId === menuConvId}
          onClick={handleMenuDeleteConversation}
        >
          {deletingConvId === menuConvId
            ? t('chats.contextMenuDeletingConversation')
            : t('chats.contextMenuDeleteConversation')}
        </button>
      </div>,
      document.body
    )

  return (
    <>
      {menuEl}
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
              onClick={() => oid && openChat(oid)}
              onContextMenu={(e) => openMenu(e, row)}
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
    </>
  )
}

export default SidebarConversations
