import React from 'react'
import { useTranslation } from 'react-i18next'
import styles from './ChatsHome.module.css'

const ChatsHome = () => {
  const { t } = useTranslation()
  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>{t('layout.selectChat')}</p>
    </div>
  )
}

export default ChatsHome
