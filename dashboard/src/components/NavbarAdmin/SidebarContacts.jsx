import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDashboard } from '../../context/DashboardContext'
import useDebounce from '../../utils/useDebounce'
import { searchUsers } from '../../actions/userActions'
import { getFriends, removeFriend } from '../../actions/friendRequest'
import styles from './SidebarContacts.module.css'

const MENU_PAD = 8
const MENU_FRAME = 12
const MENU_ITEM_H = 40

const menuHeightForItems = (n) => MENU_FRAME + n * MENU_ITEM_H

const SidebarContacts = ({ searchOpen, onSearchOpenChange }) => {
  const { t } = useTranslation()
  const { openChat, openUserProfile, clearMain, setAsideSection, mainView } = useDashboard()
  const [menu, setMenu] = useState(null)
  const [removingId, setRemovingId] = useState(null)
  const menuRef = useRef(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchValue, setSearchValue] = useState('')
  const [showRecommendations, setShowRecommendations] = useState(false)
  const debouncedValue = useDebounce(searchValue, 500)
  const [users, setUsers] = useState([])
  const [noUsersMessage, setNoUsersMessage] = useState(null)

  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true)
        setError(null)
      }
      try {
        const result = await getFriends()
        if (result?.success) {
          setItems(result.data || [])
        } else if (!silent) {
          setError(result?.error || t('contacts.loadError'))
        }
      } catch {
        if (!silent) {
          setError(t('contacts.networkError'))
        }
      } finally {
        if (!silent) {
          setLoading(false)
        }
      }
    },
    [t]
  )

  useEffect(() => {
    load()
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

  const openMenu = (e, user) => {
    e.preventDefault()
    e.stopPropagation()
    const email = user?.email
    const itemCount = 2 + (email ? 1 : 0) + 1
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
    setMenu({ x, y, user })
  }

  const handleMenuChat = () => {
    const oid = menu?.user?._id != null ? String(menu.user._id) : ''
    closeMenu()
    if (oid) openChat(oid)
  }

  const handleMenuProfile = () => {
    const oid = menu?.user?._id != null ? String(menu.user._id) : ''
    closeMenu()
    if (oid) openUserProfile(oid)
  }

  const handleMenuCopyEmail = async () => {
    const email = menu?.user?.email
    if (!email) return
    closeMenu()
    try {
      await navigator.clipboard.writeText(String(email))
    } catch {
      /* ignore */
    }
  }

  const handleMenuRemoveContact = async () => {
    const oid = menu?.user?._id != null ? String(menu.user._id) : ''
    if (!oid) return
    setRemovingId(oid)
    try {
      const result = await removeFriend(oid)
      if (result?.success) {
        closeMenu()
        await load(true)
        if (mainView.type === 'chat' && String(mainView.userId) === oid) {
          clearMain()
        } else if (mainView.type === 'userProfile' && String(mainView.userId) === oid) {
          clearMain()
          setAsideSection('contacts')
        }
      }
    } finally {
      setRemovingId(null)
    }
  }

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

  const menuUser = menu?.user
  const menuEmail = menuUser?.email
  const menuUserId = menuUser?._id != null ? String(menuUser._id) : ''

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
        <button type="button" className={styles.ctxItem} role="menuitem" onClick={handleMenuProfile}>
          {t('navbar.contextMenuViewProfile')}
        </button>
        {menuEmail ? (
          <button type="button" className={styles.ctxItem} role="menuitem" onClick={handleMenuCopyEmail}>
            {t('navbar.contextMenuCopyEmail')}
          </button>
        ) : null}
        <button
          type="button"
          className={`${styles.ctxItem} ${styles.ctxItemDanger}`}
          role="menuitem"
          disabled={removingId === menuUserId}
          onClick={handleMenuRemoveContact}
        >
          {removingId === menuUserId
            ? t('contacts.contextMenuRemovingContact')
            : t('contacts.contextMenuRemoveContact')}
        </button>
      </div>,
      document.body
    )

  return (
    <div className={styles.wrap}>
      {menuEl}
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
                            openUserProfile(user._id)
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
                  onClick={() => oid && openChat(oid)}
                  onContextMenu={(e) => openMenu(e, user)}
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
