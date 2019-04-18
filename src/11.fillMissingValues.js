// First generate some nulls, since there were not any
db.reviews.aggregate(
    [
        {
            $addFields: {
                "overall-ratings": {
                    $cond: [{$mod: ["$id", 5]}, "$overall-ratings", null] // every fifth review will have null as overall-ratings
                }
            }
        },
        {
            $out: "nulledReviews"
        }
    ]
);


// count the average overall rating
db.reviews.aggregate(
    [
        {
            $group: {
                "_id": null, average:
                    {
                        $avg: "$overall-ratings"
                    }
            }
        },
        {
            $out: "averageRating"
        }
    ]
);

// extract it
const average = db.averageRating.findOne().average;


// insert it where the overall-ratings is null
db.nulledReviews.aggregate(
    [
        {
            $addFields:
                {"overall-ratings": {$ifNull: ["$overall-ratings", average]}}
        },
        {
            $out: "notNullReviews"
        }
    ]
);



