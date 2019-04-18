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