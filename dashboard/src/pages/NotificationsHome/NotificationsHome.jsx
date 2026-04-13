import React from 'react'
import { useTranslation } from 'react-i18next'
import styles from './NotificationsHome.module.css'

const NotificationsHome = () => {
  const { t } = useTranslation()
  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>{t('layout.selectNotification')}</p>
    </div>
  )
}

export default NotificationsHome
