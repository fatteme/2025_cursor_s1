package com.movieswipe.app.data.api

import com.movieswipe.app.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    
    // Authentication endpoints
    @GET("auth/verify")
    suspend fun verifyToken(@Header("Authorization") token: String): Response<AuthResponse>
    
    @GET("auth/profile")
    suspend fun getProfile(@Header("Authorization") token: String): Response<AuthResponse>
    
    @PUT("auth/preferences")
    suspend fun updatePreferences(
        @Header("Authorization") token: String,
        @Body preferences: UserPreferences
    ): Response<AuthResponse>
    
    // Group endpoints
    @GET("groups")
    suspend fun getGroups(@Header("Authorization") token: String): Response<GroupResponse>
    
    @GET("groups/{groupId}")
    suspend fun getGroup(
        @Header("Authorization") token: String,
        @Path("groupId") groupId: String
    ): Response<GroupResponse>
    
    @POST("groups")
    suspend fun createGroup(
        @Header("Authorization") token: String,
        @Body request: CreateGroupRequest
    ): Response<GroupResponse>
    
    @POST("groups/join")
    suspend fun joinGroup(
        @Header("Authorization") token: String,
        @Body request: JoinGroupRequest
    ): Response<GroupResponse>
    
    @POST("groups/{groupId}/leave")
    suspend fun leaveGroup(
        @Header("Authorization") token: String,
        @Path("groupId") groupId: String
    ): Response<GroupResponse>
    
    @DELETE("groups/{groupId}")
    suspend fun deleteGroup(
        @Header("Authorization") token: String,
        @Path("groupId") groupId: String
    ): Response<GroupResponse>
    
    // Voting endpoints
    @POST("voting/{groupId}/start")
    suspend fun startVotingSession(
        @Header("Authorization") token: String,
        @Path("groupId") groupId: String
    ): Response<VotingSessionResponse>
    
    @GET("voting/{groupId}/current")
    suspend fun getCurrentVotingSession(
        @Header("Authorization") token: String,
        @Path("groupId") groupId: String
    ): Response<VotingSessionResponse>
    
    @POST("voting/{groupId}/vote")
    suspend fun voteOnMovie(
        @Header("Authorization") token: String,
        @Path("groupId") groupId: String,
        @Body request: VoteRequest
    ): Response<VotingSessionResponse>
    
    @POST("voting/{groupId}/end")
    suspend fun endVotingSession(
        @Header("Authorization") token: String,
        @Path("groupId") groupId: String
    ): Response<VotingSessionResponse>
    
    @GET("voting/{groupId}/results/{sessionId}")
    suspend fun getVotingResults(
        @Header("Authorization") token: String,
        @Path("groupId") groupId: String,
        @Path("sessionId") sessionId: String
    ): Response<VotingSessionResponse>
    
    @GET("voting/{groupId}/history")
    suspend fun getVotingHistory(
        @Header("Authorization") token: String,
        @Path("groupId") groupId: String
    ): Response<VotingHistoryResponse>
    
    // Movie endpoints
    @GET("movies/search")
    suspend fun searchMovies(
        @Query("query") query: String,
        @Query("limit") limit: Int = 10
    ): Response<MovieSearchResponse>
    
    @GET("movies/{movieId}")
    suspend fun getMovieDetails(
        @Path("movieId") movieId: String
    ): Response<MovieDetailsResponse>
} 