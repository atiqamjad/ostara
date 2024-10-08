package dev.krud.boost.daemon.controller.api.v1.application

import dev.krud.boost.daemon.configuration.application.ApplicationHealthService
import dev.krud.boost.daemon.configuration.application.ApplicationService
import dev.krud.boost.daemon.configuration.application.entity.Application
import dev.krud.boost.daemon.configuration.application.ro.ApplicationModifyRequestRO
import dev.krud.boost.daemon.configuration.application.ro.ApplicationRO
import dev.krud.boost.daemon.configuration.folder.validation.ValidFolderIdOrNull
import dev.krud.boost.daemon.controller.api.v1.API_PREFIX
import dev.krud.boost.daemon.controller.api.v1.AbstractCrudController
import dev.krud.crudframework.crud.handler.krud.Krud
import dev.krud.shapeshift.ShapeShift
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("$API_PREFIX/applications")
@Tag(name = "Application", description = "Application API")
class ApplicationController(
    private val applicationService: ApplicationService,
    private val applicationHealthService: ApplicationHealthService,
    private val applicationKrud: Krud<Application, UUID>,
    private val shapeShift: ShapeShift
) : AbstractCrudController<Application, ApplicationRO, ApplicationModifyRequestRO, ApplicationModifyRequestRO>(Application::class, ApplicationRO::class, shapeShift, applicationKrud) {
    @PostMapping("/{applicationId}/move")
    @ResponseStatus(HttpStatus.OK)
    @Operation(
        summary = "Move an application to a new folder",
        description = "Move an application to a new folder or root if no folder is specified"
    )
    @ApiResponse(responseCode = "200", description = "Move operation")
    @ApiResponse(responseCode = "404", description = "Application not found")
    @ApiResponse(responseCode = "503", description = "Folder invalid")
    fun moveApplication(@PathVariable applicationId: UUID, @RequestParam(required = false) @Valid @ValidFolderIdOrNull newParentFolderId: UUID? = null, @RequestParam(required = false) newSort: Double? = null): ApplicationRO {
        val application = applicationService.moveApplication(applicationId, newParentFolderId, newSort)
        return shapeShift.map(application)
    }
}