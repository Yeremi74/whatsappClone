import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getUserById, getCurrentUser } from '../../actions/userActions'
import styles from './UserProfile.module.css'
import {
  createFriendRequest,
  getFriendRequestStatus,
  cancelFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest
} from '../../actions/friendRequest'

const UserProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [me, setMe] = useState(null)
  const [meLoading, setMeLoading] = useState(true)
  const [relation, setRelation] = useState(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [relationActionBusy, setRelationActionBusy] = useState(false)
  const [actionError, setActionError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const loadMe = async () => {
      setMeLoading(true)
      try {
        const result = await getCurrentUser()
        if (!cancelled && result.success) {
          setMe(result.data)
        }
      } finally {
        if (!cancelled) setMeLoading(false)
      }
    }
    loadMe()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setActionError(null)
  }, [id])

  useEffect(() => {
    const loadUser = async () => {
      if (!id) {
        setError(t('userProfile.errors.invalidId'))
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const result = await getUserById(id)
        if (result.success) {
          setUser(result.data)
        } else {
          setError(result.error || t('userProfile.errors.loadError'))
        }
      } catch (err) {
        setError(t('userProfile.errors.network'))
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [id, t])

  const isOwnProfile =
    me && user && String(me._id) === String(user._id)

  const refreshRelation = useCallback(async () => {
    if (!user?._id || meLoading) return
    if (!me) return
    if (String(me._id) === String(user._id)) return
    try {
      const res = await getFriendRequestStatus(user._id)
      if (res.success) {
        setRelation(res.data)
      }
    } catch {
      setRelation({ status: 'none' })
    }
  }, [user, me, meLoading])

  const loadRelation = useCallback(async () => {
    if (!user?._id || meLoading) return
    if (!me) {
      setRelation(null)
      setStatusLoading(false)
      return
    }
    if (String(me._id) === String(user._id)) {
      setRelation(null)
      setStatusLoading(false)
      return
    }
    setStatusLoading(true)
    try {
      const res = await getFriendRequestStatus(user._id)
      if (res.success) {
        setRelation(res.data)
      }
    } catch {
      setRelation({ status: 'none' })
    } finally {
      setStatusLoading(false)
    }
  }, [user, me, meLoading])

  useEffect(() => {
    loadRelation()
  }, [loadRelation])

  const sendFriendRequest = async () => {
    if (!user?._id) return
    setActionError(null)
    setRelationActionBusy(true)
    try {
      const result = await createFriendRequest(String(user._id))
      if (result?.success) {
        await refreshRelation()
      }
    } catch (err) {
      setActionError(
        err.response?.data?.error || t('userProfile.errors.network')
      )
    } finally {
      setRelationActionBusy(false)
    }
  }

  const handleCancelOutgoing = async () => {
    if (!relation?.requestId) return
    setActionError(null)
    setRelationActionBusy(true)
    try {
      await cancelFriendRequest(relation.requestId)
      await refreshRelation()
    } catch (err) {
      setActionError(
        err.response?.data?.error || t('userProfile.errors.network')
      )
    } finally {
      setRelationActionBusy(false)
    }
  }

  const handleAccept = async () => {
    if (!relation?.requestId) return
    setActionError(null)
    setRelationActionBusy(true)
    try {
      await acceptFriendRequest(relation.requestId)
      await refreshRelation()
    } catch (err) {
      setActionError(
        err.response?.data?.error || t('userProfile.errors.network')
      )
    } finally {
      setRelationActionBusy(false)
    }
  }

  const handleReject = async () => {
    if (!relation?.requestId) return
    setActionError(null)
    setRelationActionBusy(true)
    try {
      await rejectFriendRequest(relation.requestId)
      await refreshRelation()
    } catch (err) {
      setActionError(
        err.response?.data?.error || t('userProfile.errors.network')
      )
    } finally {
      setRelationActionBusy(false)
    }
  }

  if (isLoading) {
    return (
      <div className={styles.userProfileContainer}>
        <div className={styles.loadingMessage}>{t('userProfile.loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.userProfileContainer}>
        <div className={styles.errorMessage}>{error}</div>
        <button
          className={styles.backButton}
          onClick={() => navigate('/')}
        >
          {t('userProfile.backButton')}
        </button>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={styles.userProfileContainer}>
        <div className={styles.errorMessage}>
          {t('userProfile.errors.userNotFound')}
        </div>
        <button
          className={styles.backButton}
          onClick={() => navigate('/')}
        >
          {t('userProfile.backButton')}
        </button>
      </div>
    )
  }

  const busy = relationActionBusy
  const showRelationBlock = !meLoading && me && !isOwnProfile

  return (
    <div className={styles.userProfileContainer}>
      <div className={styles.profileCard}>
        <button
          className={styles.backButton}
          onClick={() => navigate('/')}
        >
          {t('userProfile.backButton')}
        </button>

        <div className={styles.profileHeader}>
          {user.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.name}
              className={styles.profilePicture}
            />
          ) : (
            <div className={styles.profilePicturePlaceholder}>
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <h1 className={styles.userName}>{user.name}</h1>
        </div>

        {!meLoading && isOwnProfile && (
          <p className={styles.ownProfileHint}>{t('userProfile.ownProfile')}</p>
        )}

        {showRelationBlock && (
          <div className={styles.relationSection}>
            {statusLoading ? (
              <p className={styles.statusLabel}>
                {t('userProfile.loadingRelation')}
              </p>
            ) : relation?.status === 'accepted' ? (
              <>
                <p className={styles.friendsBadge}>
                  {t('userProfile.friendsStatus')}
                </p>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => navigate(`/chat/${user._id}`)}
                >
                  {t('userProfile.openChat')}
                </button>
              </>
            ) : relation?.status === 'pending' ? (
              relation.isFromCurrentUser ? (
                <>
                  <p className={styles.statusLabel}>
                    {t('userProfile.friendRequestOutgoing')}
                  </p>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={busy}
                    onClick={handleCancelOutgoing}
                  >
                    {t('userProfile.cancelFriendRequest')}
                  </button>
                </>
              ) : (
                <>
                  <p className={styles.statusLabel}>
                    {t('userProfile.friendRequestReceived')}
                  </p>
                  <div className={styles.actionRow}>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      disabled={busy}
                      onClick={handleAccept}
                    >
                      {t('userProfile.acceptFriendRequest')}
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      disabled={busy}
                      onClick={handleReject}
                    >
                      {t('userProfile.rejectFriendRequest')}
                    </button>
                  </div>
                </>
              )
            ) : (
              <>
                <button
                  type="button"
                  className={styles.primaryButton}
                  disabled={busy}
                  onClick={sendFriendRequest}
                >
                  {busy
                    ? t('userProfile.sending')
                    : t('userProfile.sendFriendRequest')}
                </button>
              </>
            )}
            {actionError && (
              <div className={styles.errorMessage}>{actionError}</div>
            )}
          </div>
        )}

        <div className={styles.profileInfo}>
          <div className={styles.infoItem}>
            <label className={styles.label}>{t('userProfile.email')}</label>
            <p className={styles.value}>{user.email}</p>
          </div>

          {user.description && (
            <div className={styles.infoItem}>
              <label className={styles.label}>
                {t('userProfile.description')}
              </label>
              <p className={styles.value}>{user.description}</p>
            </div>
          )}

          {user.createdAt && (
            <div className={styles.infoItem}>
              <label className={styles.label}>
                {t('userProfile.memberSince')}
              </label>
              <p className={styles.value}>
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserProfile
