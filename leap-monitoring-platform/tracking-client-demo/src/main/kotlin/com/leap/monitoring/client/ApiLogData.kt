package com.leap.monitoring.client

import java.time.Instant

/**
 * Data structure used for the API log payload sent to the Central Collector Service.
 */
data class ApiLogData(
    val serviceName: String,
    val endpoint: String,
    val requestMethod: String,
    val statusCode: Int,
    val latencyMs: Long,
    val requestSize: Long,
    val responseSize: Long,
    val timestamp: Instant = Instant.now(),
    val isRateLimitHit: Boolean = false
)