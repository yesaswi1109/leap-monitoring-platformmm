 package com.leap.collector.data

import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document(collection = "api_logs")
data class LogEntry(
    @Id
    val id: String? = null,
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

@Document(collection = "incidents")
data class Incident(
    @Id
    val id: String? = null,
    val serviceName: String,
    val endpoint: String,
    val severity: String, 
    val description: String,
    val occurredAt: Instant = Instant.now(),
    var status: IncidentStatus = IncidentStatus.OPEN,
    var resolvedBy: String? = null,
    var resolvedAt: Instant? = null,
    @Version 
    val version: Long = 0
)

enum class IncidentStatus {
    OPEN,
    RESOLVED
}