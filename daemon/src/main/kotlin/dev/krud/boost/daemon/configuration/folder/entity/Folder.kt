package dev.krud.boost.daemon.configuration.folder.entity

import dev.krud.boost.daemon.configuration.application.entity.Application
import dev.krud.boost.daemon.configuration.authentication.Authentication
import dev.krud.boost.daemon.configuration.authentication.EffectiveAuthentication
import dev.krud.boost.daemon.configuration.folder.ro.FolderRO
import dev.krud.boost.daemon.entity.AbstractEntity
import dev.krud.boost.daemon.utils.DEFAULT_COLOR
import dev.krud.crudframework.crud.annotation.Deleteable
import dev.krud.shapeshift.resolver.annotation.DefaultMappingTarget
import dev.krud.shapeshift.resolver.annotation.MappedField
import io.hypersistence.utils.hibernate.type.json.JsonType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import org.hibernate.annotations.Type
import java.util.*

@Entity
@DefaultMappingTarget(FolderRO::class)
@MappedField(mapFrom = "id")
@Deleteable(softDelete = false)
class Folder(
    @MappedField
    @Column(nullable = false)
    var alias: String,
    @MappedField
    @Column(nullable = true)
    @MappedField
    var description: String? = null,
    @MappedField
    @Column(nullable = false, columnDefinition = "varchar(30) default '$DEFAULT_COLOR'")
    var color: String = DEFAULT_COLOR,
    @MappedField
    @Column(nullable = true)
    var icon: String? = null,
    @MappedField
    @Column(nullable = true)
    var sort: Double? = null,
    @MappedField
    @Column(name = "parent_folder_id", nullable = true)
    var parentFolderId: UUID? = null,

    @MappedField
    @Type(JsonType::class)
    @Column(columnDefinition = "json")
    var authentication: Authentication = Authentication.Inherit.DEFAULT
) : AbstractEntity() {
    @ManyToOne
    @JoinColumn(name = "parent_folder_id", insertable = false, updatable = false, nullable = true)
    val parentFolder: Folder? = null

    @OneToMany(mappedBy = "parentFolder", fetch = FetchType.EAGER)
    val applications: List<Application> = listOf()

    @OneToMany(mappedBy = "parentFolder", fetch = FetchType.EAGER)
    val folders: List<Folder> = listOf()

    companion object {
        const val NAME = "folder"
        val Folder.effectiveColor: String
            get() {
                if (color != DEFAULT_COLOR) {
                    return color
                }
                return parentFolder?.effectiveColor ?: DEFAULT_COLOR
            }
        val Folder.effectiveAuthentication: EffectiveAuthentication
            get() {
                if (authentication !is Authentication.Inherit) {
                    return EffectiveAuthentication(authentication, EffectiveAuthentication.SourceType.FOLDER, id)
                }
                return parentFolder?.effectiveAuthentication
                    ?: EffectiveAuthentication(Authentication.None.DEFAULT, EffectiveAuthentication.SourceType.FOLDER, id)
            }
    }
}