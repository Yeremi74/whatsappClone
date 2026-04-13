import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './SidebarNotifications.module.css'

const SidebarNotifications = ({
  requests,
  loading,
  activeRequestId
}) => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  if (loading) {
    return <p className={styles.hint}>{t('navbar.loadingRequests')}</p>
  }

  if (requests.length === 0) {
    return <p className={styles.empty}>{t('navbar.noFriendRequests')}</p>
  }

  return (
    <div className={styles.wrap}>
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
                onClick={() => navigate(`/notifications/${rid}`)}
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
