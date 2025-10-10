// src/modules/reviews/review.service.ts
import { Review } from './review.model';
import { ICreateReview, IUpdateReview, IReviewQuery } from './review.interface';

class ReviewService {
  async createReview(data: ICreateReview) {
    return await Review.create(data);
  }

  async getReviews(query: IReviewQuery) {
    const {
      product,
      vendor,
      user,
      rating,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: any = {};
    if (product) filter.product = product;
    if (vendor) filter.vendor = vendor;
    if (user) filter.user = user;
    if (rating) filter.rating = rating;

    const skip = (page - 1) * limit;
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('user', 'name email avatar')
        .populate('product', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    return {
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getReviewById(id: string) {
    return await Review.findById(id)
      .populate('user', 'name email avatar')
      .populate('product', 'name')
      .populate('vendor', 'name');
  }

  async updateReview(id: string, data: IUpdateReview) {
    return await Review.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async deleteReview(id: string) {
    return await Review.findByIdAndDelete(id);
  }

  async upvoteReview(id: string) {
    return await Review.findByIdAndUpdate(id, { $inc: { upVotes: 1 } }, { new: true });
  }

  async downvoteReview(id: string) {
    return await Review.findByIdAndUpdate(id, { $inc: { downVotes: 1 } }, { new: true });
  }

  async addReply(id: string, userId: string, text: string) {
    return await Review.findByIdAndUpdate(
      id,
      {
        $push: {
          replies: { user: userId, text, createdAt: new Date() },
        },
      },
      { new: true }
    )
      .populate('replies.user', 'name avatar email')
      .lean();
  }
}

export default new ReviewService();
