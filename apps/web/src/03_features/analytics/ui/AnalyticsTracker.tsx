"use client"

import { useEffect, useRef } from "react"
import {
  AnalyticsPageType,
  DeviceCategory,
  TrackAnalyticsEventRequest,
} from "@/src/05_shared/api/analytics/model/analytics.type"

const VISITOR_ID_KEY = "amaneta.analytics.visitorId"
const SESSION_KEY = "amaneta.analytics.session"
const SESSION_TIMEOUT_MS = 30 * 60 * 1000

type AnalyticsTrackerProps = {
  pageType: AnalyticsPageType
  pagePath: string
  postId?: number
}

type SessionSnapshot = {
  id: string
  lastActivityAt: number
}

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const readVisitorId = () => {
  const existing = window.localStorage.getItem(VISITOR_ID_KEY)

  if (existing) {
    return existing
  }

  const next = createId()
  window.localStorage.setItem(VISITOR_ID_KEY, next)
  return next
}

const readSession = (): SessionSnapshot => {
  const now = Date.now()
  const raw = window.localStorage.getItem(SESSION_KEY)

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as SessionSnapshot

      if (
        typeof parsed.id === "string" &&
        typeof parsed.lastActivityAt === "number" &&
        now - parsed.lastActivityAt < SESSION_TIMEOUT_MS
      ) {
        const refreshed = {
          ...parsed,
          lastActivityAt: now,
        }
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(refreshed))
        return refreshed
      }
    } catch {
      window.localStorage.removeItem(SESSION_KEY)
    }
  }

  const next = {
    id: createId(),
    lastActivityAt: now,
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(next))
  return next
}

const getDeviceCategory = (): DeviceCategory => {
  const userAgent = navigator.userAgent.toLowerCase()

  if (/ipad|tablet/.test(userAgent)) {
    return "TABLET"
  }

  if (/mobile|iphone|android/.test(userAgent)) {
    return "MOBILE"
  }

  return "DESKTOP"
}

const sendAnalytics = (payload: TrackAnalyticsEventRequest) => {
  const body = JSON.stringify(payload)

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" })
    navigator.sendBeacon("/api/analytics/events", blob)
    return
  }

  void fetch("/api/analytics/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    keepalive: true,
  })
}

const getScrollPercent = () => {
  const scrollHeight =
    document.documentElement.scrollHeight - window.innerHeight

  if (scrollHeight <= 0) {
    return 100
  }

  return Math.min(
    100,
    Math.max(0, Math.round((window.scrollY / scrollHeight) * 100))
  )
}

const extractCampaignParams = () => {
  const searchParams = new URLSearchParams(window.location.search)
  return {
    utmSource: searchParams.get("utm_source"),
    utmMedium: searchParams.get("utm_medium"),
    utmCampaign: searchParams.get("utm_campaign"),
  }
}

const getReferrerHost = () => {
  if (!document.referrer) {
    return null
  }

  try {
    return new URL(document.referrer).host
  } catch {
    return null
  }
}

const AnalyticsTracker = ({
  pageType,
  pagePath,
  postId,
}: AnalyticsTrackerProps) => {
  const mountAtRef = useRef<number>(0)
  const activeStartedAtRef = useRef<number>(0)
  const accumulatedActiveMsRef = useRef<number>(0)
  const maxScrollPercentRef = useRef<number>(0)
  const flushedRef = useRef(false)

  useEffect(() => {
    const visitorId = readVisitorId()
    const session = readSession()
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const deviceCategory = getDeviceCategory()
    const dedupeBucket = Math.floor(Date.now() / 30_000)
    mountAtRef.current = Date.now()
    activeStartedAtRef.current = Date.now()

    sendAnalytics({
      visitorId,
      sessionId: session.id,
      eventType: "PAGE_VIEW",
      pageType,
      pagePath,
      postId,
      referrerHost: getReferrerHost(),
      deviceCategory,
      timezone,
      dedupeKey: `${session.id}:PAGE_VIEW:${pagePath}:${dedupeBucket}`,
      ...extractCampaignParams(),
    })

    const updateActiveTime = () => {
      if (activeStartedAtRef.current > 0) {
        accumulatedActiveMsRef.current += Date.now() - activeStartedAtRef.current
        activeStartedAtRef.current = 0
      }
    }

    const resumeActiveTime = () => {
      if (document.visibilityState === "visible" && activeStartedAtRef.current === 0) {
        activeStartedAtRef.current = Date.now()
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        updateActiveTime()
        return
      }

      resumeActiveTime()
    }

    const handleScroll = () => {
      maxScrollPercentRef.current = Math.max(
        maxScrollPercentRef.current,
        getScrollPercent()
      )
    }

    const flushEngagement = () => {
      if (flushedRef.current) {
        return
      }

      flushedRef.current = true
      updateActiveTime()
      const activeMs = accumulatedActiveMsRef.current
      const scrollPercent = Math.max(maxScrollPercentRef.current, getScrollPercent())

      if (activeMs <= 0 && scrollPercent <= 0) {
        return
      }

      sendAnalytics({
        visitorId,
        sessionId: session.id,
        eventType: "ENGAGEMENT",
        pageType,
        pagePath,
        postId,
        referrerHost: getReferrerHost(),
        deviceCategory,
        timezone,
        durationMs: activeMs,
        scrollPercent,
        dedupeKey: `${session.id}:ENGAGEMENT:${pagePath}:${mountAtRef.current}`,
        ...extractCampaignParams(),
      })
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("pagehide", flushEngagement)

    return () => {
      flushEngagement()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("pagehide", flushEngagement)
    }
  }, [pagePath, pageType, postId])

  return null
}

export default AnalyticsTracker
