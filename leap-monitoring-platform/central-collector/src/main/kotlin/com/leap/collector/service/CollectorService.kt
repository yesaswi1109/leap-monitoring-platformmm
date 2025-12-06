package com.leap.collector.service

import com.leap.collector.data.LogEntry
import com.leap.collector.data.Incident
import com.leap.collector.data.IncidentStatus
import com.leap.collector.repo.IncidentRepository
import com.leap.collector.repo.LogRepository
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class CollectorService(
    private val logRepository: LogRepository, 
    private val incidentRepository: IncidentRepository, 
    @Value("\${alerting.latency-threshold-ms}") private val latencyThreshold: Long,
    @Value("\${alerting.error-status-min}") private val errorStatusMin: Int,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    fun processLogEntry(entry: LogEntry) {
        val savedLog = logRepository.save(entry)
        log.info("Saved log to Logs DB: ${savedLog.id}")
        generateAlerts(savedLog)
    }

    private fun generateAlerts(log: LogEntry) {
        val severity: String
        val description: String
        
        if (log.isRateLimitHit) {
            severity = "RATE_LIMIT"
            description = "Rate Limit Hit: The ${log.serviceName} service exceeded its configured rate limit."
            createOrUpdateIncident(log, severity, description)
            return
        }

        if (log.latencyMs > latencyThreshold) {
            severity = "SLOW"
            description = "High Latency: ${log.latencyMs}ms exceeded threshold of ${latencyThreshold}ms."
            createOrUpdateIncident(log, severity, description)
            return
        }

        if (log.statusCode >= errorStatusMin) {
            severity = "ERROR"
            description = "Server Error: Status code ${log.statusCode} indicates a broken API."
            createOrUpdateIncident(log, severity, description)
            return
        }
    }

    private fun createOrUpdateIncident(log: LogEntry, severity: String, description: String) {
        val existingIncidents = incidentRepository.findByServiceNameAndEndpointAndStatus(
            log.serviceName, log.endpoint, IncidentStatus.OPEN
        )

        if (existingIncidents.isEmpty()) {
            val newIncident = Incident(
                serviceName = log.serviceName,
                endpoint = log.endpoint,
                severity = severity,
                description = description
            )
            incidentRepository.save(newIncident)
            this.log.warn("ALERT GENERATED: New $severity Incident created for ${log.endpoint}")
        } else {
            this.log.info("Existing $severity Incident still open for ${log.endpoint}. Not creating duplicate.")
        }
    }

    @Transactional("metadataTransactionManager")
    fun resolveIncident(incidentId: String, userId: String): Incident {
        val incident = incidentRepository.findById(incidentId).orElseThrow {
            RuntimeException("Incident with ID $incidentId not found.")
        }

        if (incident.status == IncidentStatus.RESOLVED) {
            throw IllegalStateException("Incident is already resolved.")
        }

        val resolvedIncident = incident.copy(
            status = IncidentStatus.RESOLVED,
            resolvedBy = userId,
            resolvedAt = Instant.now()
        )

        val updatedIncident = incidentRepository.save(resolvedIncident)
        log.info("Incident ${updatedIncident.id} resolved by $userId at ${updatedIncident.resolvedAt}")
        return updatedIncident
    }

    fun getAllLogs(): List<LogEntry> = logRepository.findAll()
    
    fun getOpenIncidents(): List<Incident> = incidentRepository.findAll().filter { it.status == IncidentStatus.OPEN }
}