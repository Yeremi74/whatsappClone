import React, { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDashboard } from '../../context/DashboardContext'
import { io } from 'socket.io-client'
import {
  getReceivedFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest
} from '../../actions/friendRequest'
import styles from './NotificationDetail.module.css'

const NotificationDetail = ({ requestId }) => {
  const { clearMain, openUserProfile } = useDashboard()
  const { t } = useTranslation()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const result = await getReceivedFriendRequests()
      if (result?.success && Array.isArray(result.data)) {
        const found = result.data.find((r) => String(r._id) === String(requestId))
        setRequest(found || null)
      } else {
        setRequest(null)
      }
    } catch {
      setRequest(null)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [requestId])

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
    socket.on('friendRequests:update', () => {
      load(true)
    })
    return () => {
      socket.disconnect()
    }
  }, [load])

  const from = request?.from
  const senderName = from?.name || '—'
  const senderEmail = from?.email || ''
  const picture = from?.profilePicture
  const senderId = from?._id != null ? String(from._id) : ''
  const busy = actionId != null

  const handleAccept = async () => {
    if (!request?._id) return
    setActionId(request._id)
    try {
      const result = await acceptFriendRequest(request._id)
      if (result?.success) {
        clearMain()
      }
    } finally {
      setActionId(null)
    }
  }

  const handleReject = async () => {
    if (!request?._id) return
    setActionId(request._id)
    try {
      const result = await rejectFriendRequest(request._id)
      if (result?.success) {
        clearMain()
      }
    } finally {
      setActionId(null)
    }
  }

  if (loading) {
    return (
      <div className={styles.wrap}>
        <p className={styles.center}>{t('navbar.loadingRequests')}</p>
      </div>
    )
  }

  if (!request) {
    return (
      <div className={styles.wrap}>
        <div className={styles.empty}>
          <p>{t('notifications.notFound')}</p>
          <button
            type="button"
            className={styles.back}
            onClick={() => clearMain()}
          >
            {t('notifications.backToList')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t('notifications.detailTitle')}</h1>
        <p className={styles.subtitle}>{t('navbar.friendRequests')}</p>
        <div className={styles.userRow}>
          {picture ? (
            <img className={styles.avatar} src={picture} alt="" />
          ) : (
            <span className={styles.avatarPh}>
              {senderName.charAt(0).toUpperCase()}
            </span>
          )}
          <div className={styles.userText}>
            <button
              type="button"
              className={styles.nameLink}
              onClick={() => {
                if (senderId) openUserProfile(senderId)
              }}
            >
              {senderName}
            </button>
            {senderEmail ? <p className={styles.email}>{senderEmail}</p> : null}
          </div>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.accept}
            disabled={busy}
            onClick={handleAccept}
          >
            {t('navbar.accept')}
          </button>
          <button
            type="button"
            className={styles.reject}
            disabled={busy}
            onClick={handleReject}
          >
            {t('navbar.reject')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotificationDetail
