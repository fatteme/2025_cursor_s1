package com.movieswipe.app.ui.voting

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.movieswipe.app.R
import com.movieswipe.app.data.model.Movie
import com.movieswipe.app.databinding.ActivityVotingBinding
import com.movieswipe.app.ui.voting.adapter.MovieCardAdapter
import com.yuyakaido.android.cardstackview.CardStackLayoutManager
import com.yuyakaido.android.cardstackview.CardStackListener
import com.yuyakaido.android.cardstackview.Direction
import com.yuyakaido.android.cardstackview.StackFrom
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class VotingActivity : AppCompatActivity(), CardStackListener {
    
    private lateinit var binding: ActivityVotingBinding
    private val viewModel: VotingViewModel by viewModels()
    private lateinit var cardStackLayoutManager: CardStackLayoutManager
    private lateinit var movieCardAdapter: MovieCardAdapter
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityVotingBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupCardStack()
        setupObservers()
        setupClickListeners()
        
        // Get group ID from intent
        val groupId = intent.getStringExtra("groupId")
        if (groupId != null) {
            viewModel.loadVotingSession(groupId)
        } else {
            Toast.makeText(this, "Group ID not found", Toast.LENGTH_SHORT).show()
            finish()
        }
    }
    
    private fun setupCardStack() {
        cardStackLayoutManager = CardStackLayoutManager(this, this).apply {
            setStackFrom(StackFrom.None)
            setVisibleCount(3)
            setTranslationInterval(8.0f)
            setScaleInterval(0.95f)
            setSwipeThreshold(0.3f)
            setMaxDegree(20.0f)
            setDirections(Direction.HORIZONTAL)
            setCanScrollHorizontal(true)
            setCanScrollVertical(false)
        }
        
        movieCardAdapter = MovieCardAdapter()
        binding.cardStackView.apply {
            layoutManager = cardStackLayoutManager
            adapter = movieCardAdapter
        }
    }
    
    private fun setupObservers() {
        viewModel.votingSession.observe(this) { session ->
            session?.let {
                movieCardAdapter.submitList(it.movies)
                updateProgress(it.progress)
                updateStatus(it.status)
            }
        }
        
        viewModel.isLoading.observe(this) { isLoading ->
            binding.progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
        }
        
        viewModel.error.observe(this) { error ->
            error?.let {
                Toast.makeText(this, it, Toast.LENGTH_LONG).show()
            }
        }
        
        viewModel.voteResult.observe(this) { result ->
            result?.let {
                Toast.makeText(this, "Vote recorded: $it", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun setupClickListeners() {
        binding.btnEndVoting.setOnClickListener {
            viewModel.endVotingSession()
        }
        
        binding.btnSkip.setOnClickListener {
            // Skip current movie
            cardStackLayoutManager.swipe()
        }
    }
    
    private fun updateProgress(progress: Int) {
        binding.progressBar.progress = progress
        binding.tvProgress.text = "$progress%"
    }
    
    private fun updateStatus(status: String) {
        binding.tvStatus.text = when (status) {
            "pending" -> "Waiting to start..."
            "active" -> "Voting in progress"
            "completed" -> "Voting completed"
            else -> status
        }
        
        binding.btnEndVoting.visibility = if (status == "active") View.VISIBLE else View.GONE
    }
    
    // CardStackListener implementation
    override fun onCardDragging(direction: Direction?, ratio: Float) {
        // Optional: Add visual feedback during dragging
    }
    
    override fun onCardSwiped(direction: Direction?) {
        val currentMovie = movieCardAdapter.getCurrentMovie()
        currentMovie?.let { movie ->
            val vote = when (direction) {
                Direction.Right -> "yes"
                Direction.Left -> "no"
                else -> return
            }
            
            viewModel.voteOnMovie(movie.id, vote)
        }
    }
    
    override fun onCardRewound() {
        // Handle card rewind if needed
    }
    
    override fun onCardCanceled() {
        // Handle card cancel if needed
    }
    
    override fun onCardAppeared(view: View?, position: Int) {
        // Optional: Handle when a new card appears
    }
    
    override fun onCardDisappeared(view: View?, position: Int) {
        // Optional: Handle when a card disappears
    }
} 