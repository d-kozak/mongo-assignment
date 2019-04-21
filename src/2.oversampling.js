use
reviews;

db.oversampled.deleteMany({});

db.reviews.aggregate([
    {
        $group: {
            "_id": "$company",
            count: {
                $sum: 1
            }
        }
    },
    {
        $out: "companyCount"
    }
]);

// Outputs:
//     { "_id" : "apple", "count" : 12950 }
//     { "_id" : "google", "count" : 7819 }
//     { "_id" : "microsoft", "count" : 17930 }
//     { "_id" : "amazon", "count" : 26430 }
//     { "_id" : "facebook", "count" : 1590 }
//     { "_id" : "netflix", "count" : 810 }


// unfortunately, not mongo operator to oversample, has to be done manually
const necessarySamples = 26430;

const apple = {
    name: "apple",
    reviewCount: 12950,
};
const google = {
    name: "google",
    reviewCount: 7819,
};
const microsoft = {
    name: "microsoft",
    reviewCount: 17930,
};
const amazon = {
    name: "amazon",
    reviewCount: 26430,
};
const facebook = {
    name: "facebook",
    reviewCount: 1590,
};
const netflix = {
    name: "netflix",
    reviewCount: 810,
};

for (let {name, reviewCount} of [apple, google, microsoft, facebook, netflix]) {
    const steps = Math.floor(necessarySamples / reviewCount);
    const lastIterationSamples = necessarySamples % reviewCount;

    print(`Oversampling on ${name}, which requires full ${steps} iterations and ${lastIterationSamples} extra samples in the last round`);
    for (let i = 0; i < steps; i++) {
        const samples = db.reviews.aggregate([
            {
                $match: {
                    "company": name
                }
            }, {
                $project: {
                    "_id": 0
                }
            }
        ]).toArray();
        db.oversampled.insertMany(samples);
    }
    const samples = db.reviews.aggregate([
        {
            $match: {
                "company": name
            }
        },
        {
            $project: {
                "_id": 0
            }
        },
        {
            $sample: {
                size: lastIterationSamples
            }
        }
    ]).toArray();
    db.oversampled.insertMany(samples);
}

// add amazon
db.oversampled.insertMany(db.reviews.aggregate([
    {
        $match:
            {
                company: "amazon"
            }
    },
    {
        $project: {
            "_id":
                0
        }
    }
]).toArray());