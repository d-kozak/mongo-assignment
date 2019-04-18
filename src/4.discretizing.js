db.reviews.aggregate([{
        $addFields: {
            dates: {
                $dateFromString: {
                    dateString: "$dates", // convert to date object
                    onError: new Date() // use very old date on error
                }
            }
        }
    }, {
        $addFields: {
            dates: {
                $cond: [{$gte: ["$dates", ISODate("2017-01-01")]}, "CURRENT", "OLD"] // split into two categories
            }
        }
    },
        {
            $out: "modifiedReviews"
        }
    ]
);
