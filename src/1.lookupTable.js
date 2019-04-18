/**
 * Lookup table
 */
db.reviews.aggregate(
    [
        {
            $group:
                {
                    "_id": "$company", // group based on the company
                    index: {
                        $min: "$id" // as a unique id, use the smallest review id
                    }
                }
        },
        {
            $project: {
                name: "$_id", // extract only wanted fields, which are id and name
                id: "$index",
                _id: 0 // remove the _id field
            }
        },
        {
            $out: "companies" // save into companies collection
        }

    ]
)


db.reviews.aggregate(
    [
        {
            $lookup: {                  // merge the collections together
                from: "companies",
                localField: "company",
                foreignField: "name",
                as: "others" // the documents from company collection will be included as field named others
            }
        },
        {
            $addFields:
                {
                    company: { // replace the company field using the id value
                        $arrayElemAt: ["$others.id", 0] // others is an array, therefore the arrayElemAt is used
                    }
                }
        }
    ]
)