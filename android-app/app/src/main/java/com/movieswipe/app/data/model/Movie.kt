package com.movieswipe.app.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.annotations.SerializedName

@Entity(tableName = "movies")
data class Movie(
    @PrimaryKey
    val id: String,
    val title: String,
    val overview: String,
    val posterPath: String,
    val releaseDate: String,
    val voteAverage: Double,
    val genres: List<String>,
    val score: Double = 0.0
)

data class MovieDetails(
    val id: String,
    val title: String,
    val overview: String,
    val posterPath: String,
    val backdropPath: String?,
    val releaseDate: String,
    val voteAverage: Double,
    val voteCount: Int,
    val genres: List<MovieGenre>,
    val runtime: Int?,
    val director: String?,
    val cast: List<MovieCast>,
    val videos: List<MovieVideo>
)

data class MovieGenre(
    val id: Int,
    val name: String
)

data class MovieCast(
    val id: Int,
    val name: String,
    val character: String,
    val profilePath: String?
)

data class MovieVideo(
    val id: String,
    val key: String,
    val name: String,
    val site: String,
    val type: String
)

data class MovieSearchResponse(
    val success: Boolean,
    val movies: List<Movie>? = null,
    val message: String? = null
)

data class MovieDetailsResponse(
    val success: Boolean,
    val movie: MovieDetails? = null,
    val message: String? = null
) 