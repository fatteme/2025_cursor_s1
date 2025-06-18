package com.movieswipe.app.ui.voting

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.movieswipe.app.data.api.ApiService
import com.movieswipe.app.data.model.*
import com.movieswipe.app.data.repository.AuthRepository
import com.movieswipe.app.data.repository.SocketRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class VotingViewModel @Inject constructor(
    private val apiService: ApiService,
    private val authRepository: AuthRepository,
    private val socketRepository: SocketRepository
) : ViewModel() {
    
    private val _votingSession = MutableLiveData<VotingSession>()
    val votingSession: LiveData<VotingSession> = _votingSession
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _error = MutableLiveData<String>()
    val error: LiveData<String> = _error
    
    private val _voteResult = MutableLiveData<String>()
    val voteResult: LiveData<String> = _voteResult
    
    private val _sessionEnded = MutableLiveData<CompletedVotingSession>()
    val sessionEnded: LiveData<CompletedVotingSession> = _sessionEnded
    
    private var currentGroupId: String? = null
    private var currentSessionId: String? = null
    
    init {
        setupSocketListeners()
    }
    
    fun loadVotingSession(groupId: String) {
        currentGroupId = groupId
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _error.value = null
                
                val token = authRepository.getAuthToken()
                if (token == null) {
                    _error.value = "Not authenticated"
                    return@launch
                }
                
                val response = apiService.getCurrentVotingSession("Bearer $token", groupId)
                
                if (response.isSuccessful) {
                    response.body()?.session?.let { session ->
                        _votingSession.value = session
                        currentSessionId = session.id
                        
                        // Join socket room for real-time updates
                        socketRepository.joinVotingSession(groupId)
                    }
                } else {
                    _error.value = "Failed to load voting session"
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Unknown error occurred"
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun startVotingSession(groupId: String) {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _error.value = null
                
                val token = authRepository.getAuthToken()
                if (token == null) {
                    _error.value = "Not authenticated"
                    return@launch
                }
                
                val response = apiService.startVotingSession("Bearer $token", groupId)
                
                if (response.isSuccessful) {
                    response.body()?.session?.let { session ->
                        _votingSession.value = VotingSession(
                            id = session.id,
                            groupId = session.groupId,
                            status = session.status,
                            movies = session.movies,
                            createdAt = session.createdAt
                        )
                        currentSessionId = session.id
                        currentGroupId = groupId
                        
                        // Join socket room for real-time updates
                        socketRepository.joinVotingSession(groupId)
                    }
                } else {
                    _error.value = "Failed to start voting session"
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Unknown error occurred"
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun voteOnMovie(movieId: String, vote: String) {
        viewModelScope.launch {
            try {
                val token = authRepository.getAuthToken()
                if (token == null) {
                    _error.value = "Not authenticated"
                    return@launch
                }
                
                val groupId = currentGroupId
                if (groupId == null) {
                    _error.value = "No active group"
                    return@launch
                }
                
                val request = VoteRequest(movieId, vote)
                val response = apiService.voteOnMovie("Bearer $token", groupId, request)
                
                if (response.isSuccessful) {
                    _voteResult.value = "Voted $vote on ${movieId}"
                    
                    // Also send vote through socket for real-time updates
                    socketRepository.voteMovie(movieId, vote)
                } else {
                    _error.value = "Failed to record vote"
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Unknown error occurred"
            }
        }
    }
    
    fun endVotingSession() {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _error.value = null
                
                val token = authRepository.getAuthToken()
                if (token == null) {
                    _error.value = "Not authenticated"
                    return@launch
                }
                
                val groupId = currentGroupId
                if (groupId == null) {
                    _error.value = "No active group"
                    return@launch
                }
                
                val response = apiService.endVotingSession("Bearer $token", groupId)
                
                if (response.isSuccessful) {
                    response.body()?.session?.let { session ->
                        // Convert to completed session
                        val completedSession = CompletedVotingSession(
                            id = session.id,
                            groupId = session.groupId,
                            status = session.status,
                            movies = session.movies,
                            selectedMovie = session.selectedMovie,
                            voteResults = session.voteResults,
                            startedAt = session.startedAt,
                            endedAt = session.endedAt,
                            createdAt = session.createdAt
                        )
                        _sessionEnded.value = completedSession
                        
                        // Notify through socket
                        socketRepository.endVotingSession(groupId, session.selectedMovie)
                    }
                } else {
                    _error.value = "Failed to end voting session"
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Unknown error occurred"
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    private fun setupSocketListeners() {
        socketRepository.onUserJoinedVoting { userId ->
            // Handle user joined voting session
        }
        
        socketRepository.onMovieVoted { userId, movieId, vote ->
            // Handle real-time vote updates
            _voteResult.value = "User $userId voted $vote on movie $movieId"
        }
        
        socketRepository.onVotingSessionStarted { groupId ->
            // Handle voting session started
        }
        
        socketRepository.onVotingSessionEnded { groupId, selectedMovie ->
            // Handle voting session ended
            _sessionEnded.value = CompletedVotingSession(
                id = currentSessionId ?: "",
                groupId = groupId,
                status = "completed",
                movies = _votingSession.value?.movies ?: emptyList(),
                selectedMovie = selectedMovie,
                voteResults = emptyMap(),
                startedAt = null,
                endedAt = null,
                createdAt = ""
            )
        }
        
        socketRepository.onUserLeftVoting { userId ->
            // Handle user left voting session
        }
        
        socketRepository.onError { error ->
            _error.value = error
        }
    }
    
    override fun onCleared() {
        super.onCleared()
        // Disconnect from socket when ViewModel is cleared
        currentGroupId?.let { groupId ->
            socketRepository.leaveVotingSession(groupId)
        }
    }
} 