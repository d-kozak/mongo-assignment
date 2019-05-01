db.cross_validation.deleteMany({});
db.cross_validation_0.deleteMany({});
db.cross_validation_1.deleteMany({});
db.cross_validation_2.deleteMany({});
db.cross_validation_3.deleteMany({});
db.cross_validation_4.deleteMany({});

// number of reviews
const N = db.reviews.count();
// number of categories
const K = 5;

const map = function () {
    const k = 5; // has to be local, cannot access the "outside"
    const category = Math.floor(Math.random() * k); // split choose random number  0 - 4
    emit(category, {
        reviews: [this]
    })
};

// group reviews with same key them together
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

// split the "big" cross validation collection into individual collection
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