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

First create the other tables
```js
db.reviews.aggregate(
    [
        {$group:{"_id":"$company",index:{ $min : "$id"}}},
        {$project:{name:"$_id",id:"$index",_id:0}},
        {$out:"companies"}
    ]
)
```
Then join these two tables and replace the company value in the first
```js
db.reviews.aggregate([{
    $lookup: {
        from: "companies",
        localField: "company",
        foreignField: "name",
        as: "others"
    }
}, {$addFields: 
        {company: {$arrayElemAt: ["$others.id", 0]}}}])
```

