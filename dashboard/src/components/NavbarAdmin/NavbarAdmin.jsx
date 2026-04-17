import React, { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { createSocketIo } from '../../utils/socketClient'
import { useDashboard } from '../../context/DashboardContext'
import styles from './NavbarAdmin.module.css'
import { logout } from '../../actions/authActions'
import { getReceivedFriendRequests } from '../../actions/friendRequest'
import SidebarConversations from './SidebarConversations'
import SidebarContacts from './SidebarContacts'
import SidebarNotifications from './SidebarNotifications'
import SidebarSettings from './SidebarSettings'

const iconHome = (
  <svg className={styles.railIconSvg} viewBox="0 0 24 24" aria-hidden>
    <path
      fill="currentColor"
      d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
    />
  </svg>
)

const iconChats = (
  <svg className={styles.railIconSvg} viewBox="0 0 24 24" aria-hidden>
    <path
      fill="currentColor"
      d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"
    />
  </svg>
)

const iconContacts = (
  <svg className={styles.railIconSvg} viewBox="0 0 24 24" aria-hidden>
    <path
      fill="currentColor"
      d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
    />
  </svg>
)

const iconSettings = (
  <svg className={styles.railIconSvg} viewBox="0 0 24 24" aria-hidden>
    <path
      fill="currentColor"
      d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.07.63-.07.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"
    />
  </svg>
)

const iconBell = (
  <svg className={styles.railIconSvg} viewBox="0 0 24 24" aria-hidden>
    <path
      fill="currentColor"
      d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
    />
  </svg>
)

const iconMore = (
  <svg className={styles.railIconSvg} viewBox="0 0 24 24" aria-hidden>
    <path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
)

const NARROW_BREAKPOINT_PX = 650

function useNarrowViewport(maxWidthPx = NARROW_BREAKPOINT_PX) {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${maxWidthPx - 1}px)`).matches : false
  )
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidthPx - 1}px)`)
    const handler = () => setNarrow(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [maxWidthPx])
  return narrow
}

const NavbarAdmin = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    asideSection: section,
    setAsideSection,
    mainView,
    openProfile,
    clearMain,
    resetDashboard
  } = useDashboard()
  const activeChatUserId =
    mainView.type === 'chat' ? mainView.userId : null
  const activeRequestId =
    mainView.type === 'notification' ? mainView.requestId : null

  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const [incomingFriendRequests, setIncomingFriendRequests] = useState([])
  const [incomingRequestsLoading, setIncomingRequestsLoading] = useState(false)
  const [contactsSearchOpen, setContactsSearchOpen] = useState(false)
  const [mobileSubpanelOpen, setMobileSubpanelOpen] = useState(false)
  const optionsMenuRef = useRef(null)
  const sidebarRootRef = useRef(null)
  const railRef = useRef(null)
  const isNarrow = useNarrowViewport(NARROW_BREAKPOINT_PX)

  useEffect(() => {
    if (section !== 'contacts') {
      setContactsSearchOpen(false)
    }
  }, [section])

  useLayoutEffect(() => {
    const rail = railRef.current
    const root = sidebarRootRef.current
    if (!rail || !root) return
    const update = () => {
      root.style.setProperty('--navbar-rail-width', `${rail.offsetWidth}px`)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(rail)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!isNarrow) {
      setMobileSubpanelOpen(false)
    }
  }, [isNarrow])

  useEffect(() => {
    if (!isNarrow) return
    if (
      mainView.type === 'chat' ||
      mainView.type === 'notification' ||
      mainView.type === 'profile' ||
      mainView.type === 'userProfile'
    ) {
      setMobileSubpanelOpen(false)
    }
  }, [isNarrow, mainView.type])

  useEffect(() => {
    if (!isNarrow || !mobileSubpanelOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileSubpanelOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isNarrow, mobileSubpanelOpen])

  const openMobileSubpanel = () => {
    if (isNarrow) setMobileSubpanelOpen(true)
  }

  const loadIncomingFriendRequests = useCallback(async (silent = false) => {
    if (!localStorage.getItem('token')) {
      setIncomingFriendRequests([])
      return
    }
    if (!silent) {
      setIncomingRequestsLoading(true)
    }
    try {
      const result = await getReceivedFriendRequests()
      if (result?.success) {
        setIncomingFriendRequests(result.data || [])
      } else {
        setIncomingFriendRequests([])
      }
    } catch {
      setIncomingFriendRequests([])
    } finally {
      if (!silent) {
        setIncomingRequestsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadIncomingFriendRequests(false)
  }, [loadIncomingFriendRequests])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return undefined
    const socket = createSocketIo({ auth: { token } })
    socket.on('friendRequests:update', () => {
      loadIncomingFriendRequests(true)
    })
    return () => {
      socket.disconnect()
    }
  }, [loadIncomingFriendRequests])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
        setShowOptionsMenu(false)
      }
    }
    if (showOptionsMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showOptionsMenu])

  const handleProfileClick = () => {
    setShowOptionsMenu(false)
    setAsideSection('settings')
    openProfile()
  }

  const handleLogoutClick = () => {
    setShowOptionsMenu(false)
    logout()
    resetDashboard()
    navigate('/login', { replace: true })
  }

  const requestCount = incomingFriendRequests.length

  return (
    <div className={styles.sidebarRoot} ref={sidebarRootRef}>
      <nav ref={railRef} className={styles.rail} aria-label="Main">
        <div className={styles.railTipWrap}>
          <button
            type="button"
            className={styles.brandMark}
            onClick={() => {
              setAsideSection('chats')
              openMobileSubpanel()
            }}
            aria-label={t('navbar.brand')}
          >
            {iconHome}
          </button>
          <span className={styles.railTooltip}>{t('navbar.brand')}</span>
        </div>
        <div className={styles.railTipWrap}>
          <button
            type="button"
            className={section === 'chats' ? `${styles.railBtn} ${styles.railBtnActive}` : styles.railBtn}
            onClick={() => {
              setAsideSection('chats')
              openMobileSubpanel()
            }}
            aria-label={t('navbar.chats')}
          >
            {iconChats}
          </button>
          <span className={styles.railTooltip} role="tooltip">
            {t('navbar.chats')}
          </span>
        </div>
        <div className={styles.railTipWrap}>
          <button
            type="button"
            className={section === 'contacts' ? `${styles.railBtn} ${styles.railBtnActive}` : styles.railBtn}
            onClick={() => {
              setAsideSection('contacts')
              openMobileSubpanel()
            }}
            aria-label={t('navbar.contacts')}
          >
            {iconContacts}
          </button>
          <span className={styles.railTooltip} role="tooltip">
            {t('navbar.contacts')}
          </span>
        </div>
        <div className={styles.railTipWrap}>
          <button
            type="button"
            className={section === 'settings' ? `${styles.railBtn} ${styles.railBtnActive}` : styles.railBtn}
            onClick={() => {
              setAsideSection('settings')
              openMobileSubpanel()
            }}
            aria-label={t('navbar.settings')}
          >
            {iconSettings}
          </button>
          <span className={styles.railTooltip} role="tooltip">
            {t('navbar.settings')}
          </span>
        </div>
        <div className={styles.railTipWrap}>
          <button
            type="button"
            className={section === 'notifications' ? `${styles.railBtn} ${styles.railBtnActive}` : styles.railBtn}
            onClick={() => {
              setAsideSection('notifications')
              openMobileSubpanel()
            }}
            aria-label={t('navbar.notifications')}
          >
            {iconBell}
            {requestCount > 0 && (
              <span className={styles.railBadge} aria-hidden>
                {requestCount > 9 ? '9+' : requestCount}
              </span>
            )}
          </button>
          <span className={styles.railTooltip} role="tooltip">
            {t('navbar.notifications')}
          </span>
        </div>
        <div className={styles.railSpacer} />
        <div className={styles.optionsContainer} ref={optionsMenuRef}>
          <div className={styles.railTipWrap}>
            <button
              type="button"
              className={styles.railOptions}
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              aria-label={t('navbar.options')}
              aria-expanded={showOptionsMenu}
            >
              {iconMore}
            </button>
            <span className={styles.railTooltip} role="tooltip">
              {t('navbar.options')}
            </span>
          </div>
          {showOptionsMenu && (
            <div className={styles.optionsMenu}>
              <button type="button" className={styles.menuItem} onClick={handleProfileClick}>
                {t('navbar.profile')}
              </button>
              <button type="button" className={styles.menuItemLogout} onClick={handleLogoutClick}>
                {t('navbar.logout')}
              </button>
            </div>
          )}
        </div>
      </nav>
      {isNarrow && mobileSubpanelOpen && (
        <button
          type="button"
          className={styles.subPanelBackdrop}
          aria-label={t('navbar.closePanel')}
          onClick={() => setMobileSubpanelOpen(false)}
        />
      )}
      <aside
        className={
          isNarrow
            ? `${styles.subPanel} ${mobileSubpanelOpen ? styles.subPanelMobileOpen : styles.subPanelMobileClosed}`
            : styles.subPanel
        }
        aria-label="Secondary"
        aria-hidden={isNarrow && !mobileSubpanelOpen ? true : undefined}
      >
        <div className={styles.subPanelHeader}>
          {section === 'chats' && <h2 className={styles.subPanelTitle}>{t('chats.title')}</h2>}
          {section === 'contacts' && (
            <div className={styles.subPanelHeaderRow}>
              <h2 className={styles.subPanelTitle}>{t('contacts.title')}</h2>
              <button
                type="button"
                className={styles.headerAddBtn}
                onClick={() => setContactsSearchOpen((v) => !v)}
                aria-label={t('contacts.findPeople')}
                aria-pressed={contactsSearchOpen}
              >
                <svg className={styles.headerAddIcon} viewBox="0 0 24 24" aria-hidden>
                  {contactsSearchOpen ? (
                    <path
                      fill="currentColor"
                      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                    />
                  ) : (
                    <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  )}
                </svg>
              </button>
            </div>
          )}
          {section === 'notifications' && (
            <h2 className={styles.subPanelTitle}>{t('navbar.notifications')}</h2>
          )}
          {section === 'settings' && (
            <h2 className={styles.subPanelTitle}>{t('navbar.settings')}</h2>
          )}
        </div>
        <div className={styles.subPanelBody}>
          {section === 'chats' && <SidebarConversations activeUserId={activeChatUserId} />}
          {section === 'contacts' && (
            <SidebarContacts searchOpen={contactsSearchOpen} onSearchOpenChange={setContactsSearchOpen} />
          )}
          {section === 'notifications' && (
            <SidebarNotifications
              requests={incomingFriendRequests}
              loading={incomingRequestsLoading}
              activeRequestId={activeRequestId}
              onFriendRequestRejected={(requestId) => {
                loadIncomingFriendRequests(true)
                if (activeRequestId && String(activeRequestId) === String(requestId)) {
                  clearMain()
                }
              }}
            />
          )}
          {section === 'settings' && <SidebarSettings />}
        </div>
      </aside>
    </div>
  )
}

export default NavbarAdmin
