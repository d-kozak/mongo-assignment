db.reviews.aggregate(
    [
        {
            $group: {_id: "$company", count: {$sum: 1}} // group based on company, count all reviews
        },
        {
            $project: {
                name: "$_id", _id: 0, probability: {
                    $divide: ["$count", db.reviews.count()] // divide by the total number of reviews
                }
            }
        },
        {
            $out: "probReviews" // save into another collection
        }
    ]
);


// and of course the total should be one
db.probReviews.aggregate([{$group: {"_id": "name", total: {$sum: "$probability"}}}])
