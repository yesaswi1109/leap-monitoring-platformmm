package com.leap.collector.config

import com.mongodb.client.MongoClient
import org.springframework.boot.autoconfigure.mongo.MongoProperties
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import org.springframework.data.mongodb.MongoDatabaseFactory
import org.springframework.data.mongodb.MongoTransactionManager
import org.springframework.data.mongodb.config.EnableMongoAuditing
import org.springframework.data.mongodb.core.MongoTemplate
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories
import org.springframework.beans.factory.annotation.Qualifier

// Configuration for the Logs Database (Primary)
@Configuration
@EnableMongoAuditing 
@EnableMongoRepositories(
    basePackages = ["com.leap.collector.repo.log"],
    mongoTemplateRef = "logsMongoTemplate", 
    transactionManagerRef = "logsTransactionManager" 
)
class LogsMongoConfig {
    @Primary
    @Bean(name = ["logsProperties"])
    @ConfigurationProperties(prefix = "spring.data.mongodb.primary")
    fun logsProperties(): MongoProperties = MongoProperties()

    @Primary
    @Bean(name = ["logsMongoFactory"])
    fun logsMongoFactory(mongoClient: MongoClient, @Qualifier("logsProperties") mongoProperties: MongoProperties): MongoDatabaseFactory {
        return SimpleMongoClientDatabaseFactory(mongoClient, mongoProperties.database!!)
    }

    @Primary
    @Bean(name = ["logsMongoTemplate"])
    fun logsMongoTemplate(@Qualifier("logsMongoFactory") mongoDatabaseFactory: MongoDatabaseFactory): MongoTemplate {
        return MongoTemplate(mongoDatabaseFactory)
    }

    @Primary
    @Bean(name = ["logsTransactionManager"])
    fun logsTransactionManager(@Qualifier("logsMongoFactory") mongoDatabaseFactory: MongoDatabaseFactory): MongoTransactionManager {
        return MongoTransactionManager(mongoDatabaseFactory)
    }
}

// Configuration for the Metadata Database (Secondary)
@Configuration
@EnableMongoRepositories(
    basePackages = ["com.leap.collector.repo.metadata"],
    mongoTemplateRef = "metadataMongoTemplate", 
    transactionManagerRef = "metadataTransactionManager" 
)
class MetadataMongoConfig {
    @Bean(name = ["metadataProperties"])
    @ConfigurationProperties(prefix = "spring.data.mongodb.secondary")
    fun metadataProperties(): MongoProperties = MongoProperties()

    @Bean(name = ["metadataMongoFactory"])
    fun metadataMongoFactory(mongoClient: MongoClient, @Qualifier("metadataProperties") mongoProperties: MongoProperties): MongoDatabaseFactory {
        return SimpleMongoClientDatabaseFactory(mongoClient, mongoProperties.database!!)
    }

    @Bean(name = ["metadataMongoTemplate"])
    fun metadataMongoTemplate(@Qualifier("metadataMongoFactory") mongoDatabaseFactory: MongoDatabaseFactory): MongoTemplate {
        return MongoTemplate(mongoDatabaseFactory)
    }

    @Bean(name = ["metadataTransactionManager"])
    fun metadataTransactionManager(@Qualifier("metadataMongoFactory") mongoDatabaseFactory: MongoDatabaseFactory): MongoTransactionManager {
        return MongoTransactionManager(mongoDatabaseFactory)
    }
}