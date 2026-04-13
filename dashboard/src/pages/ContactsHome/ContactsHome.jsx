import React from 'react'
import { useTranslation } from 'react-i18next'
import styles from './ContactsHome.module.css'

const ContactsHome = () => {
  const { t } = useTranslation()
  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>{t('layout.selectContact')}</p>
    </div>
  )
}

export default ContactsHome
