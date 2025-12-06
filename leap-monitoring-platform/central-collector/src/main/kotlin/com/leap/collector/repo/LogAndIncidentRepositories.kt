package com.leap.collector.repo

import com.leap.collector.data.LogEntry
import com.leap.collector.data.Incident
import com.leap.collector.data.IncidentStatus
import org.springframework.data.mongodb.repository.MongoRepository
import org.springframework.data.mongodb.repository.Query
import org.springframework.stereotype.Repository
import java.time.Instant

@Repository
interface LogRepository : MongoRepository<LogEntry, String> {
    fun findByServiceNameAndEndpoint(serviceName: String, endpoint: String): List<LogEntry>
    fun findByTimestampAfter(timestamp: Instant): List<LogEntry>
    fun findByIsRateLimitHitTrue(): List<LogEntry>
}

@Repository
interface IncidentRepository : MongoRepository<Incident, String> {
    fun findByServiceNameAndEndpointAndStatus(serviceName: String, endpoint: String, status: IncidentStatus): List<Incident>
    fun findByStatus(status: IncidentStatus): List<Incident>
    fun findByServiceName(serviceName: String): List<Incident>
}