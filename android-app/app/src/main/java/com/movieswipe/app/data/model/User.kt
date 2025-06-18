package com.movieswipe.app.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.annotations.SerializedName

@Entity(tableName = "users")
data class User(
    @PrimaryKey
    val id: String,
    val email: String,
    val name: String,
    val avatar: String? = null,
    val preferences: UserPreferences = UserPreferences(),
    val groups: List<String> = emptyList()
)

data class UserPreferences(
    val genres: List<String> = emptyList(),
    val maxRating: Int = 10,
    val minYear: Int = 1900,
    val maxYear: Int = 2024
)

data class AuthResponse(
    val success: Boolean,
    val user: User? = null,
    val message: String? = null
) 