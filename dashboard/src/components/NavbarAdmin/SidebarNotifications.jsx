import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDashboard } from '../../context/DashboardContext'
import { rejectFriendRequest } from '../../actions/friendRequest'
import styles from './SidebarNotifications.module.css'

const MENU_APPROX_W = 200
const MENU_APPROX_H = 88
const MENU_PAD = 8

const SidebarNotifications = ({
  requests,
  loading,
  activeRequestId,
  onFriendRequestRejected
}) => {
  const { openChat, openNotificationDetail } = useDashboard()
  const { t } = useTranslation()
  const [menu, setMenu] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const menuRef = useRef(null)

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

  const openMenu = (e, req) => {
    e.preventDefault()
    e.stopPropagation()
    let x = e.clientX
    let y = e.clientY
    if (x + MENU_APPROX_W + MENU_PAD > window.innerWidth) {
      x = window.innerWidth - MENU_APPROX_W - MENU_PAD
    }
    if (y + MENU_APPROX_H + MENU_PAD > window.innerHeight) {
      y = window.innerHeight - MENU_APPROX_H - MENU_PAD
    }
    x = Math.max(MENU_PAD, x)
    y = Math.max(MENU_PAD, y)
    setMenu({ x, y, req })
  }

  const handleChat = () => {
    if (!menu?.req) return
    const uid = menu.req.from?._id != null ? String(menu.req.from._id) : ''
    closeMenu()
    if (uid) openChat(uid)
  }

  const handleRemoveRequest = async () => {
    if (!menu?.req?._id) return
    const id = String(menu.req._id)
    setRejectingId(id)
    try {
      const result = await rejectFriendRequest(id)
      if (result?.success) {
        closeMenu()
        onFriendRequestRejected?.(id)
      }
    } finally {
      setRejectingId(null)
    }
  }

  if (loading) {
    return <p className={styles.hint}>{t('navbar.loadingRequests')}</p>
  }

  if (requests.length === 0) {
    return <p className={styles.empty}>{t('navbar.noFriendRequests')}</p>
  }

  const menuEl =
    menu &&
    createPortal(
      <div
        ref={menuRef}
        className={styles.contextMenu}
        style={{ left: menu.x, top: menu.y }}
        role="menu"
      >
        <button type="button" className={styles.ctxItem} role="menuitem" onClick={handleChat}>
          {t('navbar.contextMenuChat')}
        </button>
        <button
          type="button"
          className={`${styles.ctxItem} ${styles.ctxItemDanger}`}
          role="menuitem"
          disabled={rejectingId === String(menu.req._id)}
          onClick={handleRemoveRequest}
        >
          {rejectingId === String(menu.req._id) ? t('navbar.contextMenuRemoving') : t('navbar.contextMenuRemoveRequest')}
        </button>
      </div>,
      document.body
    )

  return (
    <div className={styles.wrap}>
      {menuEl}
      <p className={styles.sectionLabel}>{t('navbar.friendRequests')}</p>
      <ul className={styles.list}>
        {requests.map((req) => {
          const from = req.from
          const senderName = from?.name || '—'
          const picture = from?.profilePicture
          const initial = senderName.trim().charAt(0).toUpperCase() || '?'
          const rid = String(req._id)
          const isActive = activeRequestId && String(activeRequestId) === rid
          return (
            <li key={rid}>
              <button
                type="button"
                className={
                  isActive ? `${styles.row} ${styles.rowActive}` : styles.row
                }
                onClick={() => openNotificationDetail(rid)}
                onContextMenu={(e) => openMenu(e, req)}
              >
                {picture ? (
                  <img className={styles.avatar} src={picture} alt="" />
                ) : (
                  <span className={styles.avatarPlaceholder}>{initial}</span>
                )}
                <span className={styles.rowBody}>
                  <span className={styles.rowName}>{senderName}</span>
                  <span className={styles.rowPreview}>{t('navbar.friendRequestPreview')}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default SidebarNotifications
