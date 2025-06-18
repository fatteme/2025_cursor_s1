package com.movieswipe.app.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.annotations.SerializedName

@Entity(tableName = "voting_sessions")
data class VotingSession(
    @PrimaryKey
    val id: String,
    val groupId: String,
    val status: String, // pending, active, completed, cancelled
    val movies: List<Movie>,
    val userVotes: List<UserVote> = emptyList(),
    val progress: Int = 0,
    val startedAt: String? = null,
    val endedAt: String? = null,
    val createdAt: String
)

data class UserVote(
    val movieId: String,
    val vote: String // "yes" or "no"
)

data class VoteRequest(
    val movieId: String,
    val vote: String
)

data class VotingSessionResponse(
    val success: Boolean,
    val session: VotingSession? = null,
    val message: String? = null
)

data class VoteResults(
    val movieId: String,
    val yes: Int,
    val no: Int,
    val total: Int
)

data class CompletedVotingSession(
    val id: String,
    val groupId: String,
    val status: String,
    val movies: List<Movie>,
    val selectedMovie: Movie?,
    val voteResults: Map<String, VoteResults>,
    val startedAt: String?,
    val endedAt: String?,
    val createdAt: String
)

data class VotingHistoryResponse(
    val success: Boolean,
    val sessions: List<CompletedVotingSession>? = null,
    val message: String? = null
) 