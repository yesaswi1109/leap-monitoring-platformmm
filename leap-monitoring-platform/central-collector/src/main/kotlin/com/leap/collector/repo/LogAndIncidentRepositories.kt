package com.leap.collector.repo

import com.leap.collector.data.Incident
import com.leap.collector.data.LogEntry
import org.springframework.data.mongodb.repository.MongoRepository
import org.springframework.stereotype.Repository

// Logs Database (Primary) Repository
@Repository
interface LogRepository : MongoRepository<LogEntry, String>

// Metadata Database (Secondary) Repository
@Repository
interface IncidentRepository : MongoRepository<Incident, String> {
    fun findByServiceNameAndEndpointAndStatus(serviceName: String, endpoint: String, status: com.leap.collector.data.IncidentStatus): List<Incident>
}