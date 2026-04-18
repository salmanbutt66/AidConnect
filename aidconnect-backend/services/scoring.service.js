// services/scoring.service.js

import Volunteer from "../models/Volunteer.model.js";

// ─────────────────────────────────────────────────────────────────────────────
// SCORING WEIGHTS — tweak these to rebalance the reputation algorithm
// All weights must add up to 1.0
// ─────────────────────────────────────────────────────────────────────────────
const WEIGHTS = {
  completionRate:   0.35, // most important — did they finish what they started?
  acceptanceRate:   0.25, // did they respond when matched?
  averageRating:    0.25, // what did users think of their help?
  cancellationRate: 0.10, // did they bail after accepting? (negative)
  noResponseRate:   0.05, // did they just ignore assignments? (negative)
};

// ─────────────────────────────────────────────────────────────────────────────
// THRESHOLDS — minimum activity before score becomes meaningful
// Below these, we use a neutral baseline instead of raw rates
// ─────────────────────────────────────────────────────────────────────────────
const THRESHOLDS = {
  minAssignments: 3,  // need at least 3 assignments to move off baseline
  minRatings:     2,  // need at least 2 ratings to factor in average rating
  baselineScore:  50, // neutral starting score for new volunteers
};

// ─────────────────────────────────────────────────────────────────────────────
// PENALTIES — score deductions for specific bad behaviors
// Applied on top of the weighted calculation
// ─────────────────────────────────────────────────────────────────────────────
const PENALTIES = {
  highCancellationRate: { threshold: 0.3, deduction: 10 }, // >30% cancel rate
  highNoResponseRate:   { threshold: 0.2, deduction: 15 }, // >20% no response
  veryLowRating:        { threshold: 2.0, deduction: 10 }, // avg rating below 2
  suspensionHistory:    { deduction: 5  },                 // ever been suspended
};

// ─────────────────────────────────────────────────────────────────────────────
// BONUSES — score additions for exceptional behavior
// ─────────────────────────────────────────────────────────────────────────────
const BONUSES = {
  perfectCompletionRate: { threshold: 1.0,  bonus: 5  }, // 100% completion
  highRating:            { threshold: 4.5,  bonus: 5  }, // avg rating >= 4.5
  veteranVolunteer:      { threshold: 20,   bonus: 5  }, // 20+ completed requests
  consistentResponder:   { threshold: 0.9,  bonus: 3  }, // >90% acceptance rate
};

// ─────────────────────────────────────────────────────────────────────────────
// ScoringService — all scoring logic lives here
// ─────────────────────────────────────────────────────────────────────────────
class ScoringService {

  // ───────────────────────────────────────────────────────────────────────────
  // recalculate — main method, call after any metric-changing event
  // Returns the new score (number)
  // ───────────────────────────────────────────────────────────────────────────
  async recalculate(volunteerProfileId) {
    const profile = await Volunteer.findById(volunteerProfileId);

    if (!profile) {
      throw new Error(`Volunteer profile not found: ${volunteerProfileId}`);
    }

    const score = this._computeScore(profile);

    profile.reputationScore = score;
    await profile.save({ validateBeforeSave: false });

    return score;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // recalculateAll — batch recalculate for all volunteers
  // Used by admin "recalculate all scores" action or a cron job
  // ───────────────────────────────────────────────────────────────────────────
  async recalculateAll() {
    const volunteers = await Volunteer.find({ isApproved: true });
    const results    = [];

    for (const profile of volunteers) {
      try {
        const score = this._computeScore(profile);
        profile.reputationScore = score;
        await profile.save({ validateBeforeSave: false });
        results.push({ id: profile._id, score, status: "updated" });
      } catch (err) {
        results.push({ id: profile._id, error: err.message, status: "failed" });
      }
    }

    return {
      total:   volunteers.length,
      updated: results.filter((r) => r.status === "updated").length,
      failed:  results.filter((r) => r.status === "failed").length,
      results,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // getScoreBreakdown — returns full scoring breakdown for a profile
  // Used in admin panel analytics and volunteer profile page
  // ───────────────────────────────────────────────────────────────────────────
  async getScoreBreakdown(volunteerProfileId) {
    const profile = await Volunteer.findById(volunteerProfileId).populate(
      "user",
      "name email"
    );

    if (!profile) {
      throw new Error(`Volunteer profile not found: ${volunteerProfileId}`);
    }

    return this._buildBreakdown(profile);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // compareVolunteers — rank multiple volunteers for matching engine
  // Pass array of Volunteer profile documents
  // Returns sorted array with scores attached
  // ───────────────────────────────────────────────────────────────────────────
  compareVolunteers(profiles) {
    return profiles
      .map((profile) => ({
        profile,
        score: this._computeScore(profile),
      }))
      .sort((a, b) => b.score - a.score);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // _computeScore — core private scoring algorithm
  // ───────────────────────────────────────────────────────────────────────────
  _computeScore(profile) {
    const {
      totalAssigned,
      totalAccepted,
      totalCompleted,
      totalCancelled,
      totalNoResponse,
      averageRating,
      totalRatings,
      isSuspended,
    } = profile;

    // ── Not enough data yet — return baseline ──────────────────────────────
    if (totalAssigned < THRESHOLDS.minAssignments) {
      return THRESHOLDS.baselineScore;
    }

    // ── Compute raw rates ──────────────────────────────────────────────────
    const acceptanceRate   = totalAssigned  > 0 ? totalAccepted   / totalAssigned  : 0;
    const completionRate   = totalAccepted  > 0 ? totalCompleted  / totalAccepted  : 0;
    const cancellationRate = totalAccepted  > 0 ? totalCancelled  / totalAccepted  : 0;
    const noResponseRate   = totalAssigned  > 0 ? totalNoResponse / totalAssigned  : 0;

    // ── Normalize rating to 0–1 scale (only if enough ratings) ───────────
    const ratingScore =
      totalRatings >= THRESHOLDS.minRatings
        ? (averageRating - 1) / 4  // maps 1–5 → 0–1
        : 0.5;                     // neutral if not enough ratings yet

    // ── Weighted base score (0–100) ────────────────────────────────────────
    let score =
      (completionRate   * WEIGHTS.completionRate   * 100) +
      (acceptanceRate   * WEIGHTS.acceptanceRate   * 100) +
      (ratingScore      * WEIGHTS.averageRating    * 100) +
      ((1 - cancellationRate) * WEIGHTS.cancellationRate * 100) +
      ((1 - noResponseRate)   * WEIGHTS.noResponseRate   * 100);

    // ── Apply penalties ────────────────────────────────────────────────────
    if (cancellationRate > PENALTIES.highCancellationRate.threshold) {
      score -= PENALTIES.highCancellationRate.deduction;
    }

    if (noResponseRate > PENALTIES.highNoResponseRate.threshold) {
      score -= PENALTIES.highNoResponseRate.deduction;
    }

    if (
      totalRatings >= THRESHOLDS.minRatings &&
      averageRating < PENALTIES.veryLowRating.threshold
    ) {
      score -= PENALTIES.veryLowRating.deduction;
    }

    if (isSuspended) {
      score -= PENALTIES.suspensionHistory.deduction;
    }

    // ── Apply bonuses ──────────────────────────────────────────────────────
    if (completionRate >= BONUSES.perfectCompletionRate.threshold && totalCompleted >= 5) {
      score += BONUSES.perfectCompletionRate.bonus;
    }

    if (
      totalRatings >= THRESHOLDS.minRatings &&
      averageRating >= BONUSES.highRating.threshold
    ) {
      score += BONUSES.highRating.bonus;
    }

    if (totalCompleted >= BONUSES.veteranVolunteer.threshold) {
      score += BONUSES.veteranVolunteer.bonus;
    }

    if (acceptanceRate >= BONUSES.consistentResponder.threshold) {
      score += BONUSES.consistentResponder.bonus;
    }

    // ── Clamp to 0–100 ─────────────────────────────────────────────────────
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  // ───────────────────────────────────────────────────────────────────────────
  // _buildBreakdown — returns a human-readable breakdown object
  // ───────────────────────────────────────────────────────────────────────────
  _buildBreakdown(profile) {
    const {
      totalAssigned,
      totalAccepted,
      totalCompleted,
      totalCancelled,
      totalNoResponse,
      averageRating,
      totalRatings,
      reputationScore,
      isSuspended,
    } = profile;

    const acceptanceRate   = totalAssigned > 0 ? (totalAccepted   / totalAssigned)  : 0;
    const completionRate   = totalAccepted > 0 ? (totalCompleted  / totalAccepted)  : 0;
    const cancellationRate = totalAccepted > 0 ? (totalCancelled  / totalAccepted)  : 0;
    const noResponseRate   = totalAssigned > 0 ? (totalNoResponse / totalAssigned)  : 0;

    const ratingScore =
      totalRatings >= THRESHOLDS.minRatings
        ? (averageRating - 1) / 4
        : 0.5;

    const weightedComponents = {
      completion: {
        raw:        `${(completionRate * 100).toFixed(1)}%`,
        weighted:   +(completionRate * WEIGHTS.completionRate * 100).toFixed(2),
        weight:     `${WEIGHTS.completionRate * 100}%`,
      },
      acceptance: {
        raw:        `${(acceptanceRate * 100).toFixed(1)}%`,
        weighted:   +(acceptanceRate * WEIGHTS.acceptanceRate * 100).toFixed(2),
        weight:     `${WEIGHTS.acceptanceRate * 100}%`,
      },
      rating: {
        raw:        averageRating.toFixed(2),
        weighted:   +(ratingScore * WEIGHTS.averageRating * 100).toFixed(2),
        weight:     `${WEIGHTS.averageRating * 100}%`,
        note:       totalRatings < THRESHOLDS.minRatings ? "Using neutral baseline (insufficient ratings)" : null,
      },
      cancellation: {
        raw:        `${(cancellationRate * 100).toFixed(1)}%`,
        weighted:   +((1 - cancellationRate) * WEIGHTS.cancellationRate * 100).toFixed(2),
        weight:     `${WEIGHTS.cancellationRate * 100}%`,
      },
      noResponse: {
        raw:        `${(noResponseRate * 100).toFixed(1)}%`,
        weighted:   +((1 - noResponseRate) * WEIGHTS.noResponseRate * 100).toFixed(2),
        weight:     `${WEIGHTS.noResponseRate * 100}%`,
      },
    };

    // Active penalties
    const activePenalties = [];
    if (cancellationRate > PENALTIES.highCancellationRate.threshold) {
      activePenalties.push({
        reason:    "High cancellation rate",
        deduction: PENALTIES.highCancellationRate.deduction,
      });
    }
    if (noResponseRate > PENALTIES.highNoResponseRate.threshold) {
      activePenalties.push({
        reason:    "High no-response rate",
        deduction: PENALTIES.highNoResponseRate.deduction,
      });
    }
    if (totalRatings >= THRESHOLDS.minRatings && averageRating < PENALTIES.veryLowRating.threshold) {
      activePenalties.push({
        reason:    "Very low average rating",
        deduction: PENALTIES.veryLowRating.deduction,
      });
    }
    if (isSuspended) {
      activePenalties.push({
        reason:    "Suspension history",
        deduction: PENALTIES.suspensionHistory.deduction,
      });
    }

    // Active bonuses
    const activeBonuses = [];
    if (completionRate >= BONUSES.perfectCompletionRate.threshold && totalCompleted >= 5) {
      activeBonuses.push({
        reason: "Perfect completion rate",
        bonus:  BONUSES.perfectCompletionRate.bonus,
      });
    }
    if (totalRatings >= THRESHOLDS.minRatings && averageRating >= BONUSES.highRating.threshold) {
      activeBonuses.push({
        reason: "Excellent ratings",
        bonus:  BONUSES.highRating.bonus,
      });
    }
    if (totalCompleted >= BONUSES.veteranVolunteer.threshold) {
      activeBonuses.push({
        reason: "Veteran volunteer (20+ completions)",
        bonus:  BONUSES.veteranVolunteer.bonus,
      });
    }
    if (acceptanceRate >= BONUSES.consistentResponder.threshold) {
      activeBonuses.push({
        reason: "Consistent responder (>90% acceptance)",
        bonus:  BONUSES.consistentResponder.bonus,
      });
    }

    return {
      volunteer:    profile.user,
      currentScore: reputationScore,
      isBaseline:   totalAssigned < THRESHOLDS.minAssignments,
      metrics: {
        totalAssigned,
        totalAccepted,
        totalCompleted,
        totalCancelled,
        totalNoResponse,
        averageRating:    +averageRating.toFixed(2),
        totalRatings,
      },
      weightedComponents,
      activePenalties,
      activeBonuses,
      totalPenalty: activePenalties.reduce((sum, p) => sum + p.deduction, 0),
      totalBonus:   activeBonuses.reduce((sum, b) => sum + b.bonus, 0),
      weights:      WEIGHTS,
      thresholds:   THRESHOLDS,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // getLeaderboard — top N volunteers by reputation score
  // Used in admin analytics + public leaderboard
  // ───────────────────────────────────────────────────────────────────────────
  async getLeaderboard(limit = 10, city = null) {
    const filter = {
      isApproved:  true,
      isSuspended: false,
    };

    if (city) filter["serviceArea.city"] = new RegExp(city, "i");

    const volunteers = await Volunteer.find(filter)
      .populate("user", "name profilePicture location bloodGroup")
      .sort({ reputationScore: -1 })
      .limit(limit)
      .select(
        "reputationScore averageRating totalCompleted totalRatings " +
        "isAvailable skills emergencyTypes serviceArea"
      );

    return volunteers.map((v, index) => ({
      rank:           index + 1,
      volunteer:      v,
      reputationScore: v.reputationScore,
      averageRating:  v.averageRating,
      totalCompleted: v.totalCompleted,
      isAvailable:    v.isAvailable,
    }));
  }

  // ───────────────────────────────────────────────────────────────────────────
  // getScoreLabel — human-readable label for a score value
  // Use in frontend badges and admin tables
  // ───────────────────────────────────────────────────────────────────────────
  getScoreLabel(score) {
    if (score >= 85) return { label: "Elite",       color: "success", icon: "⭐" };
    if (score >= 70) return { label: "Trusted",     color: "primary", icon: "✅" };
    if (score >= 55) return { label: "Reliable",    color: "info",    icon: "👍" };
    if (score >= 40) return { label: "Developing",  color: "warning", icon: "📈" };
    return             { label: "At Risk",      color: "danger",  icon: "⚠️" };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // simulateScore — preview what score a volunteer WOULD get with new stats
  // Used in admin panel for what-if analysis
  // ───────────────────────────────────────────────────────────────────────────
  simulateScore({
    totalAssigned,
    totalAccepted,
    totalCompleted,
    totalCancelled,
    totalNoResponse,
    averageRating,
    totalRatings,
    isSuspended = false,
  }) {
    const mockProfile = {
      totalAssigned,
      totalAccepted,
      totalCompleted,
      totalCancelled,
      totalNoResponse,
      averageRating,
      totalRatings,
      isSuspended,
    };

    return this._computeScore(mockProfile);
  }
}

export default new ScoringService();