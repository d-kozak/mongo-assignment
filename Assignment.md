# Assignment to the subject Scalable Methods of Data Analysis

## Source
As a data set, I choose [reviews](https://www.kaggle.com/petersunga/google-amazon-facebook-employee-reviews/version/2) of five tech companies, which I found 
on [kaggle](https://kaggle.com) 

## Import into mongo
This dataset can be downloaded as a csv file, the command for importing it is
```
mongoimport -d reviews -c reviews --type csv --file employee_reviews.csv --headerline
```
This command will import the csv file into database reviews as a collection reviews

Note: Since the first column did not have a name in the csv file, which resulted in a document property with empty name, I added a name "id" to it before import
This id was used in the first task of creating a lookup table.


## 1) Lookup table

First create the lookup table
```js
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
```
Then join these two tables and replace the company value in the first
```js
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
        },
        {
                    $out: "reviews2" // save into new collection, just to be save
        }
    ]
)
```


## 2) Oversampling
For this task I decided to perform oversampling on the companies, because the distribution of reviews per company is uneven.
This can be easily determined by executing the following query.
```js
db.reviews.aggregate([
    {
        $group: {
            "_id": "$company",
            count: {
                $sum: 1
            }
        }
    }
]);
```
Which results in 
```js
 { "_id" : "apple", "count" : 12950 }
 { "_id" : "google", "count" : 7819 }
 { "_id" : "microsoft", "count" : 17930 }
 { "_id" : "amazon", "count" : 26430 }
 { "_id" : "facebook", "count" : 1590 }
 { "_id" : "netflix", "count" : 810 }
```
Unfortunately the aggregation operator sample cannot oversample, therefore it was necessary to perform this task mostly using a javascript code.
```js
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
```

## 3) Undersampling
Thanks to the fact that there is a sample aggregation operator, this task could be in a simple manner as you can see in the code below.

```js
const min = 810;

for (let name of ["apple", "google", "microsoft", "amazon", "facebook", "netflix"]) {
    const samples = db.reviews.aggregate([
        {
            $match: {
                "company": name
            }
        }, {
            $sample: {
                size: min
            }
        },{
            $project:{
                "_id":0
            }
        }
    ]).toArray();
    db.undersampled.insertMany(samples);
}
```

## 4) Discretizing
For the discretizing tasks I decided to convert the dates property. In the original collection, it contains dates in string format.
Since for reviews their date is very important, I decided to discretize this column into values from the set {"CURRENT","OLD},
where all the reviews that are older than 1.1.2017 are considered old.
```js
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
```

## 5) Probability analysis
I decided to analyze is what is the probability of each review to belong to a specific company.
```js
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
db.probReviews.aggregate( [ {$group:{ "_id":"name",total: { $sum : "$probability"  }  }}])
```

## 6) Tf-idf
This was a challenging task. In the end, I ended up using map-reduce to perform it.
I decided to calculate the importance of the word 'work'. First, I had to perform a precomputation
to determine in how many reviews this word occurs.
```js
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
```
Than I grouped this information together with total document count and joined them with stats, creating new collection 
withStats.
```js
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
```
Afterwards, I could calculate the tf-idf using the following query.
```js
const map = function () {
    const calcTf = (word, document) => {
        const count = document.filter(elem => word === elem).length;
        return count / document.length;
    };
    const stats = this.stats[0];
    const tf = calcTf("work", `${this.summary}`.split(' '));
    const idf = Math.log10(stats.totalDocs / stats.work);
    const tfidf = tf * idf;
    emit(this.id, {
        summary: this.summary,
        tfidf
    })
};

db.withStats.mapReduce(
    map,
    function (key, values) {
        throw new Error(`Should never be called, was called with key ${key} and values ${values}`)
    },
    {
        out: "tfidf"
    }
);
```
## 7) Index
I decided to create an index over the summary field, since it contains the longest strings in the dataset.
This task turned out to be fairly straightforward using map-reduce. It can be achieved using the following code.
```js
db.reviews.mapReduce(
    function () {
        for (let word of `${this.summary}`.split(/\s+/)) {
            emit(word, {
                documents: [this.id]
            });
        }
    },
    function (key, values) {
        const documents = [];
        for(let value of values){
            documents.push(...value.documents)
        }
        return {
            documents
        }
    },
    "index"
)
```

## 10) Remove noise
For this task I decided to remove all the reviews that are older than 1.1.2018.
This can be done using the following query. 
```js
db.reviews.aggregate([
    {
        $addFields: {
            dates: {
                $dateFromString: {
                    dateString: "$dates", // convert to date object
                    onError: new Date() // use very old date on error
                }
            }
        }
    },
    {
        $match: {
            dates: {
                $gte: ISODate("2018-01-01")
            }
        }
    },
    {
        $out:"withoutNoise"
    }
]);
```

## 11) Fill missing values
First generate some nulls, since there were not any
```js
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
```
count the average overall rating
```js
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
```
// extract it
```js
const average = db.averageRating.findOne().average;
```
Finally insert the average value where the overall-ratings is null
```js
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
```

## 12) Pivot table
For this tasks I decided to calculate the average, rating per company in 
* overall-ratings
* work-balance-stars
* culture-values-stars
* carrer-opportunities-stars

This can be achieved using the following aggregation pipeline.
```js
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
```