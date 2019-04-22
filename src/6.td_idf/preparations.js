db.reviews.mapReduce(
    function () {
        emit(null, `${this.summary}`.indexOf(' work ') > 0 ? 1 : 0);
    },
    function (key, values) {
        return Array.sum(values);
    },
    {
        out: "wordStats"
    }
);

db.wordStats.aggregate([
    {
        $project: {
            "work": "$value",
        }
    },
    {
        $addFields: {
            "totalDocs": 67529
        }
    },
    {$out: "wordStats"}
]);

db.reviews.aggregate([
    {
        $lookup: {
            from: "wordStats",
            localField: "null",
            foreignField: "null",
            as: "stats"
        }
    },
    {$out: "withStats"}
]);