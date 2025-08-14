"use client"
import React from 'react';
import { useEffect,useState } from 'react';
import {
  Star,
  StarHalf,
  SortDesc,
  Filter,
  MessageSquare
} from 'lucide-react';
import {Navbar} from '../../../components/Navbar';
import {ModernFooter} from '../../../components/ModernFooter';
import { Review, reviewsAPI, Doctor,doctorsAPI } from '../../../lib/api';
// --- HELPER COMPONENTS ---
/**
 * Renders a single star rating.
 * @param {number} rating The rating to display.
 */
// Function to calculate the average rating from the reviews
  const calculateAverageRating = (reviews: Review[]) => {
    if (reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return parseFloat((totalRating / reviews.length).toFixed(1));
  };

export const useReviews = (doctorId: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define the handleSort function here. It will be available in the hook's scope.
  const handleSort = (key: keyof Review, order: 'asc' | 'desc') => {
    const sortedReviews = [...reviews].sort((a, b) => {
      if (key === 'rating') {
        return order === 'asc' ? a.rating - b.rating : b.rating - a.rating;
      }
      if (key === 'timestamp') {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return order === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
    setReviews(sortedReviews);
  };

  // Effect to fetch reviews when the component mounts or doctorId changes
  useEffect(() => {
    const getReviews = async () => {
      try {
        setIsLoading(true);
        // Use your existing reviewsAPI function
        const data = await reviewsAPI.getByDoctorId(doctorId);
        setReviews(data);
        setAverageRating(calculateAverageRating(data));
      } catch (err) {
        setError("Failed to fetch reviews. Please try again later.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    getReviews();
  }, [doctorId]);

  return { reviews, averageRating, isLoading, error, handleSort };
};

const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center text-yellow-400">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="w-5 h-5" fill="currentColor" stroke="none" />
      ))}
      {hasHalfStar && <StarHalf className="w-5 h-5" fill="currentColor" stroke="none" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="w-5 h-5 text-gray-300" />
      ))}
    </div>
  );
};


export default function ReviewsPage() {
  const doctorId = "1";
  const [doctor, setDoctor] = useState<Doctor | undefined>(undefined);
  const { reviews, averageRating, isLoading, error, handleSort } = useReviews(doctorId);

  useEffect(() => {
    const getDoctor = async () => {
      if (doctorId) {
        try {
          const docDetails = await doctorsAPI.getById(doctorId);
          setDoctor(docDetails);
        } catch (err) {
          console.error("Failed to fetch doctor details:", err);
        }
      }
    };
    getDoctor();
  }, [doctorId]);

  if (isLoading && !doctor) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 font-sans">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans">
        <p className="text-red-500 font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans antialiased">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
            {error}
          </div>
        )}

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header and Average Rating Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{doctor ? `${doctor.name}'s Feedback Dashboard` : "Feedback Dashboard"}</h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">See all reviews from your patients.</p>
            </div>
            <div className="mt-6 md:mt-0 md:ml-8 flex-shrink-0 text-center">
              {isLoading ? (
                <div className="text-gray-500 dark:text-gray-400">Loading...</div>
              ) : (
                <>
                  <p className="text-5xl font-extrabold text-blue-600 dark:text-blue-400 leading-none">{averageRating}</p>
                  <StarRating rating={averageRating} />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{reviews.length} total reviews</p>
                </>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-4">
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Recent Reviews</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleSort('rating', 'desc')}
                  className="flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors duration-200">
                  <SortDesc className="w-4 h-4 mr-1" />
                  Rating
                </button>
                <button
                  onClick={() => handleSort('timestamp', 'desc')}
                  className="flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors duration-200">
                  <Filter className="w-4 h-4 mr-1" />
                  Newest
                </button>
              </div>
            </div>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading reviews...</div>
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow transition-all duration-200 hover:shadow-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <StarRating rating={review.rating} />
                      <p className="mt-2 text-gray-800 dark:text-white font-medium">{review.reviewText}</p>
                    </div>
                    <p className="ml-4 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{new Date(review.timestamp).toLocaleDateString()}</p>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 font-light">
                    — {review.patientName}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 p-8">
                No reviews available yet.
              </div>
            )}
          </div>
        </div>
      </div>
      <ModernFooter />
    </div>
  );
}

