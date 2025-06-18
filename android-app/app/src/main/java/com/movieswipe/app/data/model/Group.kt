package com.movieswipe.app.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.annotations.SerializedName

@Entity(tableName = "groups")
data class Group(
    @PrimaryKey
    val id: String,
    val name: String,
    val invitationCode: String,
    val owner: GroupMember,
    val members: List<GroupMember>,
    val memberCount: Int,
    val status: String,
    val createdAt: String
)

data class GroupMember(
    val id: String,
    val name: String,
    val email: String,
    val avatar: String? = null,
    val preferences: UserPreferences? = null
)

data class CreateGroupRequest(
    val name: String
)

data class JoinGroupRequest(
    val invitationCode: String
)

data class GroupResponse(
    val success: Boolean,
    val group: Group? = null,
    val groups: List<Group>? = null,
    val message: String? = null
) 