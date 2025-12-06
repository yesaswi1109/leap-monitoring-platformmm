package com.leap.monitoring.client

import io.github.bucket4j.Bucket
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.servlet.HandlerInterceptor

@Component
class ApiTrackingInterceptor(
    private val logSenderService: LogSenderService,
    private val rateLimiterRegistry: RateLimiterRegistry,
    @Value("\${collector.service-name}") private val serviceName: String
) : HandlerInterceptor {

    private val log = LoggerFactory.getLogger(javaClass)

    companion object {
        private const val START_TIME_ATTRIBUTE = "monitoringStartTime"
        private const val REQUEST_SIZE_ATTRIBUTE = "monitoringRequestSize"
        private const val RATE_LIMIT_HIT_ATTRIBUTE = "rateLimitHit"
    }

    /**
     * Executes BEFORE the request reaches the controller.
     * Records start time and performs Rate Limiting.
     */
    override fun preHandle(request: HttpServletRequest, response: HttpServletResponse, handler: Any): Boolean {
        request.setAttribute(START_TIME_ATTRIBUTE, System.currentTimeMillis())
        val requestSize = request.contentLengthLong
        request.setAttribute(REQUEST_SIZE_ATTRIBUTE, requestSize)

        // Rate Limiter Check
        val bucket: Bucket = rateLimiterRegistry.getBucket(serviceName)

        if (!bucket.tryConsume(1)) {
            // Requirement: Request continues normally even if limit is hit
            log.warn("RATE LIMIT HIT for service $serviceName. Request continuing normally.")
            request.setAttribute(RATE_LIMIT_HIT_ATTRIBUTE, true)
        }

        return true 
    }

    /**
     * Executes AFTER the controller finishes, but before the response is finalized.
     * Calculates latency and sends the log.
     */
    override fun afterCompletion(
        request: HttpServletRequest,
        response: HttpServletResponse,
        handler: Any,
        ex: Exception?
    ) {
        val startTime = request.getAttribute(START_TIME_ATTRIBUTE) as Long? ?: return
        val requestSize = request.getAttribute(REQUEST_SIZE_ATTRIBUTE) as Long? ?: 0
        val rateLimitHit = request.getAttribute(RATE_LIMIT_HIT_ATTRIBUTE) as Boolean? ?: false

        val endTime = System.currentTimeMillis()
        val latencyMs = endTime - startTime

        val responseSize = response.getHeader("Content-Length")?.toLong() ?: 0

        val logData = ApiLogData(
            serviceName = serviceName,
            endpoint = request.requestURI,
            requestMethod = request.method,
            statusCode = response.status,
            latencyMs = latencyMs,
            requestSize = requestSize,
            responseSize = responseSize,
            isRateLimitHit = rateLimitHit
        )

        logSenderService.sendLog(logData)
    }
}