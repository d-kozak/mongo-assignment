db.pivot.deleteMany({});

db.reviews.aggregate([
    {
        $group: {
            "_id": "$company",
            "overall-ratings": {
                $avg: "$overall-ratings"
            },
            "work-balance-stars": {
                $avg: "$work-balance-stars"
            },
            "culture-values-stars": {
                $avg: "$culture-values-stars"
            },
            "carrer-opportunities-stars": {
                $avg: "$carrer-opportunities-stars"
            }
        }
    },
    {
        $out: "pivot"
    }
]);