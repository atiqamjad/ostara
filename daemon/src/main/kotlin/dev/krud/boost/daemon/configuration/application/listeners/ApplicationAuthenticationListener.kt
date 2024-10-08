package dev.krud.boost.daemon.configuration.application.listeners

import dev.krud.boost.daemon.messaging.AgentAuthenticationChangedMessage
import dev.krud.boost.daemon.configuration.application.ApplicationService
import dev.krud.boost.daemon.configuration.application.entity.Application
import dev.krud.boost.daemon.messaging.ApplicationAuthenticationChangedMessage
import dev.krud.boost.daemon.messaging.ApplicationDisableSslVerificationChangedMessage
import dev.krud.boost.daemon.messaging.ApplicationMovedEventMessage
import dev.krud.boost.daemon.configuration.authentication.Authentication
import dev.krud.boost.daemon.messaging.FolderAuthenticationChangedMessage
import dev.krud.boost.daemon.utils.resolve
import dev.krud.crudframework.crud.handler.krud.Krud
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.cache.CacheManager
import org.springframework.integration.annotation.ServiceActivator
import org.springframework.integration.channel.QueueChannel
import org.springframework.messaging.Message
import org.springframework.messaging.support.GenericMessage
import org.springframework.stereotype.Component
import java.util.*

@Component
class ApplicationAuthenticationListener(
    private val applicationKrud: Krud<Application, UUID>,
    private val instanceHealthCheckRequestChannel: QueueChannel,
    private val applicationService: ApplicationService,
    cacheManager: CacheManager
) {
    private val applicationEffectiveAuthenticationCache by cacheManager.resolve()

    @ServiceActivator(inputChannel = "systemEventsChannel")
    fun onMessage(message: Message<*>) {
        when (message) {
            is FolderAuthenticationChangedMessage -> handleParentFolderAuthenticationChanged(message.payload.folderId)
            is AgentAuthenticationChangedMessage -> handleParentFolderAuthenticationChanged(message.payload.agentId)
            is ApplicationMovedEventMessage -> {
                log.debug { "Handling application moved event for application ${message.payload.applicationId}" }
                forceUpdateInstancesHealth(message.payload.applicationId)
            }
            is ApplicationAuthenticationChangedMessage -> {
                log.debug { "Handling application authentication changed event for application ${message.payload.applicationId}" }
                forceUpdateInstancesHealth(message.payload.applicationId)
            }
            is ApplicationDisableSslVerificationChangedMessage -> {
                log.debug { "Handling application disable ssl verification changed event for application ${message.payload.applicationId}" }
                forceUpdateInstancesHealth(message.payload.applicationId)
            }
        }
    }

    fun handleParentFolderAuthenticationChanged(folderId: UUID) {
        log.debug {
            "Handling parent folder authentication changed event for folder $folderId"
        }
        applicationKrud.searchByFilter {
            where {
                Application::parentFolderId Equal folderId
                Application::authenticationType Equal Authentication.Inherit.DEFAULT.type
            }
        }
            .forEach { application ->
                forceUpdateInstancesHealth(application.id)
            }
    }

    fun handleParentAgentAuthenticationChanged(agentId: UUID) {
        log.debug {
            "Handling parent folder authentication changed event for agent $agentId"
        }
        applicationKrud.searchByFilter {
            where {
                Application::parentAgentId Equal agentId
                Application::authenticationType Equal Authentication.Inherit.DEFAULT.type
            }
        }
            .forEach { application ->
                forceUpdateInstancesHealth(application.id)
            }
    }


    fun forceUpdateInstancesHealth(applicationId: UUID) {
        log.debug { "Requesting update of instances health for application $applicationId" }
        applicationEffectiveAuthenticationCache.evict(applicationId)
        val instances = applicationService.getApplicationInstances(applicationId)
        instances.forEach {
            log.trace { "Application $applicationId requested update of instance ${it.id} health" }
            instanceHealthCheckRequestChannel.send(
                GenericMessage(it.id)
            )
        }
    }

    companion object {
        private val log = KotlinLogging.logger { }
    }
}