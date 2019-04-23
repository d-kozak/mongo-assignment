const N = db.reviews.count();
const K = 5;

const map = function () {
    const k = 5;
    const category = Math.floor(Math.random() * k);
    emit(category, {
        reviews: [this]
    })
};

const reduce = function (key, values) {
    const reviews = [];
    for (let item of values) {
        reviews.push(...item.reviews);
    }
    return {
        reviews
    }
}

db.reviews.mapReduce(
    map,
    reduce,
    "cross_validation"
)


for (let i = 0; i < K; i++) {
    db.cross_validation.aggregate([
        {
            $match: {"_id": i}
        },
        {
            $unwind: "$value.reviews"
        },
        {
            $project: {
                "review": "$value.reviews"
            }
        },
        {
            $project: {
                "value": 0,
                "_id": 0
            }
        },
        {
            $out: `cross_validation_${i}`
        }
    ]);
}