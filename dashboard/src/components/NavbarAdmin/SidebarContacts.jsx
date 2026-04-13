import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useDebounce from '../../utils/useDebounce'
import { searchUsers } from '../../actions/userActions'
import { getFriends } from '../../actions/friendRequest'
import styles from './SidebarContacts.module.css'

const SidebarContacts = ({ searchOpen, onSearchOpenChange }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchValue, setSearchValue] = useState('')
  const [showRecommendations, setShowRecommendations] = useState(false)
  const debouncedValue = useDebounce(searchValue, 500)
  const [users, setUsers] = useState([])
  const [noUsersMessage, setNoUsersMessage] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getFriends()
      if (result?.success) {
        setItems(result.data || [])
      } else {
        setError(result?.error || t('contacts.loadError'))
      }
    } catch {
      setError(t('contacts.networkError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const fetchUsers = async () => {
      if (!debouncedValue.trim()) {
        setUsers([])
        setNoUsersMessage(null)
        return
      }
      try {
        const result = await searchUsers('name', debouncedValue)
        setUsers(result?.data || [])
        setNoUsersMessage(result?.messageKey || null)
      } catch {
        setUsers([])
        setNoUsersMessage(null)
      }
    }
    fetchUsers()
  }, [debouncedValue])

  return (
    <div className={styles.wrap}>
      {searchOpen && (
        <div className={styles.searchBlock}>
          <label className={styles.searchLabel} htmlFor="sidebarContactsSearch">
            {t('navbar.searchUsers')}
          </label>
          <input
            id="sidebarContactsSearch"
            type="text"
            className={styles.searchInput}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setShowRecommendations(true)}
            onBlur={() => setShowRecommendations(false)}
            autoComplete="off"
            placeholder={t('contacts.searchPlaceholder')}
          />
          {showRecommendations && (
            <div className={styles.recommendations}>
              <h3 className={styles.recommendationHeading}>{t('search.recommendations')}</h3>
              {noUsersMessage ? (
                <p className={styles.recommendationEmpty}>{t(noUsersMessage)}</p>
              ) : (
                <ul className={styles.recommendationList}>
                  {users?.map((user) => {
                    const name = user.name || '—'
                    const initial = name.trim().charAt(0).toUpperCase() || '?'
                    return (
                      <li key={user._id} className={styles.recommendationItem}>
                        <button
                          type="button"
                          className={styles.recommendationButton}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            onSearchOpenChange(false)
                            setSearchValue('')
                            navigate(`/${user._id}`)
                          }}
                        >
                          {user.profilePicture ? (
                            <img
                              className={styles.recommendationAvatar}
                              src={user.profilePicture}
                              alt=""
                            />
                          ) : (
                            <span className={styles.recommendationAvatarPlaceholder}>
                              {initial}
                            </span>
                          )}
                          <span className={styles.recommendationBody}>
                            <span className={styles.recommendationName}>{name}</span>
                            {user.email ? (
                              <span className={styles.recommendationEmail}>{user.email}</span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
      {loading ? (
        <p className={styles.hint}>{t('contacts.loading')}</p>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : items.length === 0 ? (
        <p className={styles.empty}>{t('contacts.empty')}</p>
      ) : (
        <ul className={styles.list}>
          {items.map((user) => {
            const name = user.name || '—'
            const initial = name.trim().charAt(0).toUpperCase() || '?'
            const oid = user._id != null ? String(user._id) : ''
            return (
              <li key={oid}>
                <button
                  type="button"
                  className={styles.row}
                  onClick={() => oid && navigate(`/chat/${oid}`)}
                >
                  {user.profilePicture ? (
                    <img className={styles.avatar} src={user.profilePicture} alt="" />
                  ) : (
                    <span className={styles.avatarPlaceholder}>{initial}</span>
                  )}
                  <span className={styles.rowBody}>
                    <span className={styles.rowName}>{name}</span>
                    {user.email ? (
                      <span className={styles.rowEmail}>{user.email}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default SidebarContacts
